---
layout: blog-single
title: Mage::getStoreConfig() in tight loops
description: An investigation on the performance of repeatedly calling Mage::getStoreConfig() compared to using local variables.
date: February 02, 2017
image: 
tags: [magento, scaling, performance]
ad: domain-clamp-ad-b.html
---

Recently, while doing some profiling of an uncached category page, I noticed something funny...A sizable amount of time being spent on `Mage::getStoreConfig()`. 

Digging in, I saw that it was coming from the navigation module. It contained a function called `getAllFilterableOptionsAsHash`, which builds a map of URL keys (using it's own logic) to Magento attribute option IDs. It looks something like this (abbreviated for simplicity's sake)...

```php?start_inline=true
public function getAllFilterableOptionsAsHash()
{
    $hash = array();

    $attributes = $this->getFilterableAttributes();

    $options = $this->getAllOptions();

    foreach ($attributes as $a) {
        $hash[$a->getAttributeCode()] = array();
        foreach ($options as $o){
            if (o['attribute_id'] == $a->getId()) {
                $key = $this->createKey($o['url_alias']);
                $key .= Mage::getStoreConfig('module/part/special_char');
                $hash[$code][$key] = $o['option_id'];
            }
        }
    }

    return $hash;
}
```

In  this case `getAllFilterableAttributes` will return all attributes that are filterable and `getAllOptions` will return all options for filterable attributes. On the site in question there were 18 filterable attributes with ~4250 options.

Based on the code above, this means `Mage::getStoreConfig('module/part/special_char');` will be called ~4250 times. I began to wonder what the benefit might be of caching the value in an temporary value, rather than calling `Mage::getStoreConfig` over and over. Here, I'll share the results of my investigation...

<!-- excerpt_separator -->

### Testing Script

I wrote the following script as a quick test. It will make two passes of a loop 5000 times. The first time it will concatenate the store name onto an empty string using `Mage::getStoreConfig()`, the second time it will first store the result of `Mage::getStoreConfig()` into a temporary variable, and concatenate that onto an empty string each time. In order to remove penalty of the initial fetch to Mage::getStoreConfig from the equation it warms up the store config cache (in `$warmup`) before starting the timer.

```php
<?php

require_once('app/Mage.php');
Mage::app();

$iterations = 5000;

$warmup = Mage::getStoreConfig('general/store_information/name');

// w/o tmp
$start = microtime(true);
for ($i = 0; $i <= $iterations; $i++) {
    $string = '';
    $string .= Mage::getStoreConfig('general/store_information/name');
}
$end = microtime(true);
echo 'TOTAL (WITHOUT TMP): ' . (round($end * 1000) - round($start * 1000)) . PHP_EOL;;

// w/ tmp
$start = microtime(true);
$tmp = Mage::getStoreConfig('general/store_information/name');
for ($i = 0; $i <= $iterations; $i++) {
    $string = '';
    $string .= $tmp;
}
$end = microtime(true);
echo 'TOTAL (WITH TMP): ' . (round($end * 1000) - round($start * 1000)) . PHP_EOL;
```

### The Result

Executing this script yielded the following...

```
$ php mage-get-store-config.php
TOTAL (WITHOUT TMP): 8
TOTAL (WITH TMP): 1
```

Without temporary storage the script took around 8ms. With it it took only 1ms.

### The Scaling Problem

This may not seem like a huge deal. However, within this loop, it turned out `$key .= Mage::getStoreConfig('module/part/special_char');` wasn't the only time `Mage::getStoreConfig()` was being called.

You may remember from the above that `getAllFilterableOptionsAsHash()` also called a method named `createKey()`. This method, it turned out, contained 4 other calls to `Mage::getStoreConfig()` that suffered from the same problem. Let's update our script to reflect...

```php
<?php

require_once('app/Mage.php');
Mage::app();

$iterations = 5000;

$name = Mage::getStoreConfig('general/store_information/name');
$phone = Mage::getStoreConfig('general/store_information/phone');
$country = Mage::getStoreConfig('general/store_information/merchant_country');
$address = Mage::getStoreConfig('general/store_information/address');

// w/o tmp
$start = microtime(true);
for ($i = 0; $i <= $iterations; $i++) {
    $string = '';
    $string .= Mage::getStoreConfig('general/store_information/name');
    $string .= Mage::getStoreConfig('general/store_information/phone');
    $string .= Mage::getStoreConfig('general/store_information/merchant_country');
    $string .= Mage::getStoreConfig('general/store_information/address');
}
$end = microtime(true);
echo 'TOTAL (WITHOUT TMP): ' . (round($end * 1000) - round($start * 1000)) . PHP_EOL;;

// w/ tmp
$start = microtime(true);
$name = Mage::getStoreConfig('general/store_information/name');
$phone = Mage::getStoreConfig('general/store_information/phone');
$country = Mage::getStoreConfig('general/store_information/merchant_country');
$address = Mage::getStoreConfig('general/store_information/address');
for ($i = 0; $i <= $iterations; $i++) {
    $string = '';
    $string .= $name;
    $string .= $phone;
    $string .= $country;
    $string .= $address;
}
$end = microtime(true);
echo 'TOTAL (WITH TMP): ' . (round($end * 1000) - round($start * 1000)) . PHP_EOL;
```


And the result

```bash
$ php mage-get-store-config.php
TOTAL (WITHOUT TMP): 29
TOTAL (WITH TMP): 1
```

With the temporary variables it still took around 1ms. However, hitting `Mage::getStoreConfig()` each time took ~29ms.

### What About More Than 5000 Iterations?

5000 really isn't that many iterations. Imagine, instead of attribute options, this loop was working with products on a store that had 50,000 products. Bumping `$iterations` to 50,000 leads to the following result...

```bash
$ php mage-get-store-config.php
TOTAL (WITHOUT TMP): 278
TOTAL (WITH TMP): 12
```

This would cut off around a quarter of a second. Not to shabby.

Just for fun what let's see what would happen on a store with 1,000,000 products.

```bash
$ php mage-get-store-config.php
TOTAL (WITHOUT TMP): 5647
TOTAL (WITH TMP): 218
```

Over 5 seconds cut off in this case! This would have been a major issue on a catalog that size if this code was executing on requests to the frontend.

### Conclusion

Hopefully this was enlightening for some of you. The lesson here is... 


![](/img/blog/mage-get-store-config-in-tight-loops/always-be-caching.jpg)

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.