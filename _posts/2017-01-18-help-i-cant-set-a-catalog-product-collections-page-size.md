---
layout: blog-single
title: Help! I Can't Set A Catalog Product Collection's Page Size
description: I recently ran into an issue where I was unable to set the page size on a product collection. Here I outline the issue I ran into.
date: January 18, 2017
image: 
tags: [Magento]
ad: domain-clamp-ad-b.html
---

I ran up against a pretty interesting issue recently. I was looking to render a custom block (descendant of `Mage_Catalog_Block_Product_List`) in a CMS block. You can do this with template variables...

```
{% raw %}{{block type="mpchadwick_customproductlist/list" template="mpchadwick/customproductlist/list.phtml"}}{% endraw %}
```

Then, in my custom product list block I was setting up the collection in the constructor.

```php
<?php

class Mpchadwick_CustomProductList_Block_List extends Mage_Catalog_Block_Product_List
{

    protected $helper;

    protected function _construct()
    {
    
        $this->helper = Mage::helper('mpchadwick_customproductlist');
        
        $collection = Mage::getModel('catalog/product')
            ->getCollection();
        
        $helper->filterCollection($collection);       
        
        $this->setCollection($collection);
         
        return parent::_construct();
    }
}
```

One of the things I was looking to do in the `filterCollection` was set the page size. However, no matter what I did (e.g. `setPageSize`, `setPage`, `limit` on the `Varien_Db_Select` object) it still wouldn't work.

Finally, after an hour of pulling out my hair, I figured out why.

<!-- excerpt_separator -->

### The Bloody Toolbar

If you look in the `Mage_Catalog_Block_Product_List::_beforeToHtml()` you'll see the following line (some code omitted for clarity)...

```php?start_inline=true
protected function _beforeToHtml()
{
    $toolbar = $this->getToolbarBlock();

    $collection = $this->_getProductCollection();
    $toolbar->setCollection($collection);

    return parent::_beforeToHtml();
}
```

Looking at `Mage_Catalog_Block_Product_List_Toolbar::setCollection()` you'll see the following (again, some code omitted for clarity)

```php?start_inline=true
public function setCollection($collection)
{
    $this->_collection = $collection;

    $limit = (int)$this->getLimit();
    if ($limit) {
        $this->_collection->setPageSize($limit);
    }
    return $this;
}
```

Aha! So before rendering a rendering `Mage_Catalog_Block_Product_List` (or any descendant) **the toolbar sets the page size!** Unfortunately, the toolbar doesn't check if the someone already tried to set a limit on the collection.

### What Can Be Done

Below is the entire body of `Mage_Catalog_Block_Product_List::getLimit()` in all its glory.

```php?start_inline=true
public function getLimit()
{
    $limit = $this->_getData('_current_limit');
    if ($limit) {
        return $limit;
    }

    $limits = $this->getAvailableLimit();
    $defaultLimit = $this->getDefaultPerPageValue();
    if (!$defaultLimit || !isset($limits[$defaultLimit])) {
        $keys = array_keys($limits);
        $defaultLimit = $keys[0];
    }

    $limit = $this->getRequest()->getParam($this->getLimitVarName());
    if ($limit && isset($limits[$limit])) {
        if ($limit == $defaultLimit) {
            Mage::getSingleton('catalog/session')->unsLimitPage();
        } else {
            $this->_memorizeParam('limit_page', $limit);
        }
    } else {
        $limit = Mage::getSingleton('catalog/session')->getLimitPage();
    }
    if (!$limit || !isset($limits[$limit])) {
        $limit = $defaultLimit;
    }

    $this->setData('_current_limit', $limit);
    return $limit;
}
```

The line(s) I'd like to draw your attention to is the following...

```php?start_inline=true
$limit = $this->_getData('_current_limit');
if ($limit) {
    return $limit;
}
```

If `_current_limit` is in the `_data` array of the object, just go with that.

### How Can We Use This

The trick is to also override the `getToolbarBlock` in your custom block. What I did looks like this...

```php?start_inline=true
public function getToolbarBlock()
{
    $block = parent::getToolbarBlock();

    $block->setData('_current_limit', $this->helper->limit());

    return $block;
}
```


### Conclusion

I hope that some of you found this post helpful, in case you run into a similar issue. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
