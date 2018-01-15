---
layout: blog-single
title:  "Magento Lesson #579: Don't Use The Config For Flags"
description: A lesson learned as a result of an ongoing investigation where the process responsible for syncing orders from Magento to an ERP system continually got "stuck".
date: January 05, 2018
image:
tags: [Magento]
---

> Orders are not flowing from Magento to our ERP

Sound familiar?

I've been engaged in an ongoing investigation of this nature on a particular project and finally got to the bottom of it today. 

The lesson learned...don't use the config for storing flags. 

Let's take a look at what happened

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: Examples here are based on Magento 1, but the same principle applies to Magento 2.</p>
</div>

### The (pseudo) code

The code in question looked something like this...

```php?start_inline=1
if ($this->isRunning()) {
	return;
}

$this->setRunning();

$this->doWork();

$this->unsetRunning();
```

`isRunning()`, `setRunning()` and `unsetRunning()` were all based on a particular piece of data in the config. They looked something like this...

**`isRunning()`**

```php?start_inline=1
return Mage::getStoreConfigFlag('vendor/extension/flag')
```

**`setRunning()`**

```php?start_inline=1
Mage::getConfig()->saveConfig('vendor/extension/flag', 1);
```

**`unsetRunning()`**

```php?start_inline=1
Mage::getConfig()->saveConfig('vendor/extension/flag', 0);
```

Simple enough...

### The Problem

The problem here is that `Mage::getStoreConfigFlag()` (and `Mage::getStoreConfig()`) consult the config cache. However `saveConfig()` writes to the database and doesn't clear the config cache after doing so (**which is a good thing**).  This means that something like this can happen...

1. Job #1 starts
1. Job #1 calls `isRunning()` which returns false, Job #1 proceeds
1. Job #1 calls `setRunning()` which sets the flag in the `core_config_data` table
1. Job #1 begins doing work
1. Something else happens and causes Magento to regenerate the config cache. Running flag is saved to config cache as true
1. Job #1 finishes doing work
1. Job #1 calls `unsetRunning()` which clears flag from `core_config_data` table but not from config cache. 

After this, any other job cannot get past the `isRunning()` check until the config cache is flushed.

### The Solution

The solution is simple...don't use the config for storing flags. Instead, use the flagging system provided by the framework (starting with `Mage_Core_Model_Flag`).

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: <code>Mage_Index_Model_Lock</code> is another option.</p>
</div>

Using this framework the methods look something like this instead...

**`isRunning()`**

```php?start_inline=1
return Mage::getModel('core/flag', ['flag_code' => 'vendor_extension_flag'])
	->loadSelf()
	->getFlagData();
```

**`setRunning()`**

```php?start_inline=1
Mage::getModel('core/flag', ['flag_code'= > 'vendor_extension_flag'])
	->setFlagData(true)
	->save();
```

**`unsetRunning()`**

```php?start_inline=1
Mage::getModel('core/flag', ['flag_code' => 'vendor_extension_flag'])
	->setFlagCode(false)
	->save();
```

