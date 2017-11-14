---
layout: blog-single
title:  Magento and New Relic Error&nbsp;Rate
description: A look at what New Relic's Error Rate means for Magento applications.
date: November 13, 2017
image: /img/blog/magento-and-new-relic-error-rate/new-relic-error-rate@2x.jpg
tags: [Magento, Monitoring]
---

[New Relic's Error rate monitoring and alerting feature](https://docs.newrelic.com/docs/apis/rest-api-v2/application-examples-v2/application-error-rate-example-v2#avg-error-image) is a great way to catch unforeseen issues in production. However, properly using the feature requires an understanding of what is actually being measured.

In this post, we'll take a look at what what New Relic's "Error Rate" means for Magento applications.

<!-- excerpt_separator -->

### PHP Errors

There are a few ways that "errors" can manifest themselves in Magento systems. One such way is as a PHP error. For example, let's say there was syntax error in `index.php` as follows...

```
$ head -n 5 index.php
<?php
Whoops <-- This will fatal error
/**
 * Application entry point
 * 
```

One the frontend the user will see a screen like this...

<img
  class="rounded shadow"
  src="/img/blog/magento-and-new-relic-error-rate/500-error@1x.jpg"
  srcset="/img/blog/magento-and-new-relic-error-rate/500-error@1x.jpg 1x, /img/blog/magento-and-new-relic-error-rate/500-error@2x.jpg 2x"
  alt="500 Error">
  
The error will also be logged to PHP's `error_log` like this...

```
PHP Parse error:  syntax error, unexpected 'will' (T_STRING), expecting '[' in /Applications/MAMP/htdocs/magento2.2-develop/index.php on line 2
```

The New Relic PHP agent will detect these errors by default and report them to New Relic, and they will be tracked when measuring New Relic's Error Rate.

### Handled Exceptions

Another possible "error" scenario in Magento is a handled exception. An example of this would be if `app/etc/env.php` specified invalid database credentials. In this case Magento would not able to establish a connection to the database. The user would be presented a screen like this...

<img
  class="rounded shadow"
  src="/img/blog/magento-and-new-relic-error-rate/magento-handled-exception@1x.jpg"
  srcset="/img/blog/magento-and-new-relic-error-rate/magento-handled-exception@1x.jpg 1x, /img/blog/magento-and-new-relic-error-rate/magento-handled-exception@2x.jpg 2x"
  alt="Magento handled exception">
  
Details on the "error" could then be found in `var/report/1089155067867`...

```
$ cat var/report/1089155067867
...SQLSTATE[HY000] [1045] Access denied for user...
```

By default, this "Error" would not be reported to New Relic, however. This is because it isn't truly a PHP Error, but rather an `Exception` that Magento handled.  As such, by default, these types of "Errors" would not be accounted for in New Relic's Error Rate.

### Upcoming Changes In Magento 2.2

In [pull request #11944](https://github.com/magento/magento2/pull/11944), I introduced a changeset that uses [`newrelic_notice_error`](https://docs.newrelic.com/docs/agents/php-agent/php-agent-api/newrelic_notice_error) to report handled exceptions to New Relic. When these changes become available, New Relic Error Rate will begin to account for handled exceptions.

As I'm not a Magento employee I can't personally promise which release these changes will go into, but I'm hopeful that they'll be available in v2.2.2.

### What About Magento 1

In Magento 1, exceptions are caught in `Mage::run`

```php?start_inline=1
try {
  // Run application
} catch (Exception $e) {
    if (self::isInstalled() || self::$_isDownloader) {
        self::printException($e);
        exit();
    }

    // If Magento isn't installed
}
```

There isn't a great way to integrate the changes to report handled exceptions to New Relic without modifying core, but core can be changed to do this as follows...

```php?start_inline=1
try {
  // Run application
} catch (Exception $e) {
    if (self::isInstalled() || self::$_isDownloader) {
        if (extension_loaded('newrelic')) {
            newrelic_notice_error($e->getMessage(), $e);
        }
        self::printException($e);
        exit();
    }

    // If Magento isn't installed
}
```

Hope you found these details helpful!