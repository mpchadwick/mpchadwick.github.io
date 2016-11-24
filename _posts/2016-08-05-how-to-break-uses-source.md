---
layout: blog-single
title: One "Weird Trick" To Instantly Break usesSource
description: usesSource *seems* like a safe means for determining if an attribute has a source model. I'll show you why that's not actually the case, though.
date: August 05, 2016
tags: [magento, debugging]
---

As you might know, Magento features several frontend input types for catalog attributes. For example the "New From Date" attribute, is stored as `DATETIME` in the `catalog_product_entity_datetime` table, whereas the product's "Name" is stored as `VARCHAR(255)` in the `catalog_product_entity_varchar` table.

For both of these attribute types, the values can be pulled directly from the db and are ready to display to the end user with no further manipulation. However, there are a couple types which are initially stored numerically (e.g. in `catalog_product_entity_int`) and need to be translated via `eav_attribute_option` and `eav_attribute_option_value` before they are ready to be displayed to the end user.

There is a method in `Mage_Eav_Model_Entity_Attribute_Abstract` (an ancestor of `Mage_Catalog_Model_Resource_Eav_Attribute`) called `usesSource`. It is uncommented, but at first glance it looks like it can reliably used to determine whether or not an attribute's values need to be translated in that way...

```php?start_inline=1
public function usesSource()
{
    return $this->getFrontendInput() === 'select' || $this->getFrontendInput() === 'multiselect'
        || $this->getData('source_model') != '';
}
```

However, as I learned the hard way, there's this "one weird trick" that will cause `usesSource` to return true **no matter what**.

<!-- excerpt_separator -->

### The "Trick"

The "trick" is simple. Before calling `usesSource()` on the attribute, call `getSource()` which is defined in `Mage_Eav_Model_Entity_Attribute_Abstract`. Watch and be amazed...

**The Code**

```php
<?php

require_once('app/Mage.php');
Mage::app();

$product = Mage::getModel('catalog/product')->load(384);

$attribute = $product->getResource()->getAttribute('name');
echo 'Before:' . PHP_EOL;
var_dump($attribute->usesSource()) . PHP_EOL;
echo 'After:' . PHP_EOL;
$attribute->getSource();
var_dump($attribute->usesSource()) . PHP_EOL;
```

**The Result**

```
Before:
bool(false)
After:
bool(true)
```

### Why Does This Happen?

To understand why this happens, you need to look at the internals of `getSource()`. Here they are...

```php?start_inline=1
/**
 * Retrieve source instance
 *
 * @return Mage_Eav_Model_Entity_Attribute_Source_Abstract
 */
public function getSource()
{
    if (empty($this->_source)) {
        if (!$this->getSourceModel()) {
            $this->setSourceModel($this->_getDefaultSourceModel());
        }
        $source = Mage::getModel($this->getSourceModel());
        if (!$source) {
            throw Mage::exception('Mage_Eav',
                Mage::helper('eav')->__('Source model "%s" not found for attribute "%s"',$this->getSourceModel(), $this->getAttributeCode())
            );
        }
        $this->_source = $source->setAttribute($this);
    }
    return $this->_source;
}
```

Specifically, this line is of interest...

```php?start_inline=1
$this->setSourceModel($this->_getDefaultSourceModel());
```

Remember we're working with a `Mage_Catalog_Model_Resource_Eav_Attribute`. Here's how it defines `_getDefaultSourceModel()` 

```php?start_inline=1
/**
 * Get default attribute source model
 *
 * @return string
 */
public function _getDefaultSourceModel()
{
    return 'eav/entity_attribute_source_table';
}
```

Now let's take one more look at `usesSource()`...


```php?start_inline=1
public function usesSource()
{
    return $this->getFrontendInput() === 'select' || $this->getFrontendInput() === 'multiselect'
        || $this->getData('source_model') != '';
}
```

Specifically this line...

``` php?start_inline=1
$this->getData('source_model') != '';
```

As demonstrated above, calling `getSource()` on the attributes leads to the `source_model` being set. As a result `usesSource()` will now return true, even for attributes that aren't `select`s or `multiselect`s.

### Why Should I Care?

One would think that a method called `usesSource()` is a safe means for determining whether a not a given attribute uses a source model. However, because calling `getSource()` on an attribute makes `usesSource()` return true always, it turns out it's not. `usesSource()` is not documented, so we can't say for sure whether or not this is expected behavior, but in my mind this is a Magento bug.

In my case, I ran into a lot of issues getting Vinai Kopp's **awesome** [Nicer Image Names](https://github.com/Vinai/nicer-image-names) plugin to work because `usesSource()` is used to determine whether the an attribute value needs translation. This works fine on an out of box installation. However, in practice, community and local code is likely to call `getSource()` on attribute that don't use source models, hence "corrupting" `usesSource()`. Here's an example from `BlueAcorn_UniversalAnalytics` which attempts to find the value of an attribute for a product

```php?start_inline=1
/**
 * Initial entry point for finding product attribute values
 *
 * @name findAttributeValue
 * @param Mage_Catalog_Model_Product $product
 * @param string $attribute
 * @return mixed
 */
protected function findAttributeValue($product, $attribute) {
    $newValue = null;

    foreach (Array('getListAttributeValue', 'getNormalAttributeValue') as $method) {
        $newValue = $this->$method($product, $attribute);
        if ($newValue !== null) break;
    }
    
    $newValue = ($attribute == 'coupon_code') ? strtoupper($newValue) : $newValue;
    $newValue = str_replace(array("\n", "\t", "\r"), ' ', $newValue);

    return $newValue;
}
```

`getListAttributeValue()` will wind up calling `getSource()` on the attribute first. If that fails, then it will fall back to `getNormalAttributeValue` which will try to fetch the attribute value using a magic getter.

While I was working through this issue I found that there were actually two plugins within the same project that were doing this!

### What To Do?

At this point, Magento should just leave this one as is. Changing the API for `getSource()` may have other downstream impacts. However, as a responsible developer, you should...

1. Not rely on `usesSource()` for determining whether an attribute has a source model
2. Not call `getSource()` on attribute unless you know it has a source model.
