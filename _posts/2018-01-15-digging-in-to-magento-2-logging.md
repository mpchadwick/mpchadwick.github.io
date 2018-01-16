---
layout: blog-single
title:  "Digging In To Magento 2 Logging"
description: A look at how logging has been implemented in Magento 2
date: January 15, 2018
image:
tags: [Magento]
---

For better or worse, logging has changed a lot in Magento 2. 

Previously the `Mage` god class defined a static `log` method through which all logging happened. 

```php?start_inline=1
// app/Mage.php
public static function log($message, $level = null, $file = '', $forceLog = false)
```

Now, logging uses a light wrapper on top of [Monolog](https://github.com/Seldaek/monolog). 

There's already some [good information](https://www.atwix.com/magento-2/logging-system/) outlining *how to do logging* in Magento 2, so we won't focus on that here (well, we will look at it, but only very briefly). Instead, here we'll dig into the core Magento logging code to understand exactly **how logging works in Magento 2 internally**.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This post is based as the Magento code base as of version 2.2.2.</p>
</div>

### The Entry Point

In `app/etc/di.xml`, very close to the top, you'll find the following...

```xml
<preference for="Psr\Log\LoggerInterface" type="Magento\Framework\Logger\Monolog" />
```

This means that when you ask for an instance of `Psr\Log\LoggerInterface` you'll wind up with an instance of `Magento\Framework\Logger\Monolog`. This is how you do logging in Magento 2.

```php
<?php

use Psr\Log\LoggerInterface as Logger;

class Foo
{
    private $logger;

    public function __construct(Logger $logger)
    {
        $this->logger = $logger;
    }
}
```

### The Logger

`Magento\Framework\Logger\Monolog` extends `Monolog\Logger\Monolog`, the entry point for logging when using Monolog without Magento. There are two main things it is responsible for doing..

#### 1. Passing the Handlers

By constructing an instance of the logger through the Magento framework, di.xml can be used to pass arguments. 

The handlers passed to the logger are also found in `app/etc/di.xml`. If you'll scroll further down the file you'll see the following...

```xml
<type name="Magento\Framework\Logger\Monolog">
    <arguments>
        <argument name="handlers"  xsi:type="array">
            <item name="system" xsi:type="object">Magento\Framework\Logger\Handler\System</item>
            <item name="debug" xsi:type="object">Magento\Framework\Logger\Handler\Debug</item>
        </argument>
    </arguments>
</type>
```

As we can see, by default, Magento declares 2 handlers, the `system` handler and the `debug` handler.

#### 2. Intercepting Exception Logging

`Magento\Framework\Logger\Monolog` also checks each log record to inspect whether or not it is an `Exception`. If it is, it ensures that this is specified in the `$context` (we'll see why this is important shortly). It also, grabs the exception message before passing the record to the parent...

```php?start_inline=1
// Magento\Framework\Logger\Monolog
public function addRecord($level, $message, array $context = [])
{
    if ($message instanceof \Exception && !isset($context['exception'])) {
        $context['exception'] = $message;
    }

    $message = $message instanceof \Exception ? $message->getMessage() : $message;

    return parent::addRecord($level, $message, $context);
}
```

### The System Handler

The system handler will accept anything with log level `INFO` of higher and write it to `var/log/system.log`.

```php?start_inline=1
// Magento\Framework\Logger\Handler\System
protected $fileName = '/var/log/system.log';

protected $loggerType = Logger::INFO;
```

However, before doing so it will check if the log record is an `Exception` (now we see why the `$context` was important). In that case it will pass the record to `$exceptionHandler` (an instance of `Magento\Framework\Logger\Handler\Exception`) and bail before writing to `system.log`...

```php?start_inline=1
// Magento\Framework\Logger\Handler\System
public function write(array $record)
{
    if (isset($record['context']['exception'])) {
        $this->exceptionHandler->handle($record);

        return;
    }

    parent::write($record);
}
```

### The Exception Handler

The exception handler is pretty boring. Outside of specifying `var/log/exception.log` as its log file, it doesn't do anything...

```php?start_inline=1
// Magento\Framework\Logger\Handler\Exception
protected $fileName = '/var/log/exception.log';
```

### The Debug Handler

On the surface, the debug handler looks to be more or less as boring as the exception handler, simply specifying as the file name `var/log/debug.log` and that it will write DEBUG level logs...

```php?start_inline=1
// Magento\Framework\Logger\Handler\Debug
protected $fileName = '/var/log/debug.log';

protected $loggerType = Logger::DEBUG;
```

That is, until you realize that `Magento_Developer` specifies a preference for `Magento\Framework\Logger\Handler\Debug`

```xml
<preference for="Magento\Framework\Logger\Handler\Debug" type="Magento\Developer\Model\Logger\Handler\Debug"/>
```

`Magento\Developer\Model\Logger\Handler\Debug` checks that debug logging setting is enabled prior to logging.

```php
// Magento\Developer\Model\Logger\Handler\Debug::isHandling()
return parent::isHandling($record)
    && $this->scopeConfig->getValue('dev/debug/debug_logging', ScopeInterface::SCOPE_STORE);
```

Debug logging is off by default, so if you want to see debug logs, you'll need to specifically enable it in the admin panel under Stores > Configuration > Advanced > Developer > Debug > Log to File.
