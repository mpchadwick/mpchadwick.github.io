---
layout: blog-single
title: Enterprise_PageCache is Borked In 1.14.3.X
description: Enterprise_PageCache is broken in Magento Enterprise 1.14.3.0 and 1.14.3.1. In this post I'll out line the issue and the patch.
date: January 20, 2017
image: 
tags: [magento]
ad: domain-clamp-ad-b.html
---

If you are thinking about installing or upgrading to Magento Enterprise 1.14.3.X read this post right now. **`Enterprise_PageCache` is completely borked in both 1.14.3.0 and 1.14.3.1.**  The repro steps for the bug are not only dead simple, but also extremely common user behavior...

---

#### Steps To Reproduce

1. Ensure that full page cache is turned on
2. Navigate to a category page
3. Apply any layered navigation filter
4. Remove the filter you just applied

#### Expected result

Unfiltered category page is displayed

#### Actual result

Filtered category page continues to display

---

What's worse, **the cache for the unfiltered category page is now poisoned for any user who visits that page!**

The good news it that there's a patch available, SUPEE-9465. If that's all you're looking for I've posted it [here](https://gist.github.com/mpchadwick/d8d41bf8c0502d833d9f3872a31c3c6e).

However, because it's interesting, let's take at what went wrong starting in 1.14.3.0.

<!-- excerpt_separator -->

### Cache Key Generation

I'm not going to go super deep on this topic (check out [my Nomad Mage talk](https://nomadmage.com/monitoring-improving-full-page-cachehit-rate-enterprise_pagecache/) if you're interested), but when visiting the category page `Enterprise_PageCache_Model_Processor_Category` is responsible for generating the cache key for the request. When the page is not coming from cache, `getPageIdInApp` is called to provide the cache key for saving the request. On the flip side, when `Enterprise_PageCache` attempts to load the response from cache, it calls `getPageIdWithoutApp` to get the key.

### The Issue

The problem lies in the `_getQueryParams` method in `Enterprise_PageCache_Model_Processor_Category`. Specifically you'll see this line in a vanilla 1.14.3.X install.

```php?start_inline=true
$queryParams = $this->_filterInputParameters(array_merge($this->_getSessionParams(), $_GET));
```

Prior to 1.14.3.X that line looked like this...

```php?start_inline=true
$queryParams = array_merge($this->_getSessionParams(), $_GET);
```

`_filterInputParameters` is a new method introduced in 1.14.3.0. If you look at it you'll see it winds up stripping off anything not in the protected `$_paramsMap` property.

```php?start_inline=true
protected function _filterInputParameters($inputParameters)
{
    return array_intersect_key(
        !$inputParameters
            ? array()
            : $inputParameters,
        array_flip($this->_paramsMap)
    );
}
```

Here's what's in `$_paramsMap`...

```php?start_inline=true
protected $_paramsMap = array(
    'display_mode'  => 'mode',
    'limit_page'    => 'limit',
    'sort_order'    => 'order',
    'sort_direction'=> 'dir',
);
```

The problem is that `_getQueryParams` is called by `getPageIdInApp`. What this means is that when saving an uncached category page, the cache key will not account for anything other than the parameters in `$_paramsMap`. In other words, **viewing a filtered page will always poison the cache for unfiltered pages** because the response will be saved with the same key that is generated when filters are not applied.

### The Solution

To remediate the issue, [SUPEE-9465](https://gist.github.com/mpchadwick/d8d41bf8c0502d833d9f3872a31c3c6e) reverts that change. 

```php?start_inline
@@ -180,7 +182,7 @@ class Enterprise_PageCache_Model_Processor_Category extends Enterprise_PageCache
     protected function _getQueryParams()
     {
         if (is_null($this->_queryParams)) {
-            $queryParams = $this->_filterInputParameters(array_merge($this->_getSessionParams(), $_GET));
+            $queryParams = array_merge($this->_getSessionParams(), $_GET);
```

It also marks `_filterInputParameters` as deprecated and removes all usage.

```php?start_inline=true
--- app/code/core/Enterprise/PageCache/Model/Processor/Category.php
+++ app/code/core/Enterprise/PageCache/Model/Processor/Category.php
@@ -49,6 +49,8 @@ class Enterprise_PageCache_Model_Processor_Category extends Enterprise_PageCache
      * Filter input parameters using parameters map
      * @param array $inputParameters
      *
+     * @deprecated
+     *
      * @return array
      */
     protected function _filterInputParameters($inputParameters)
```

### My Thoughts

Personally, I'm shocked by the fact that Magento introduced this bug in v1.14.3.0 and released v1.14.3.1 without including the fix. From my perspective the severity of this issue is extreme...

- Unless you're not using `Enterprise_PageCache` (one of the main selling points of Enterprise Edition) you *are* affected by this.
- The moment someone clicks on a filter, it breaks the unfiltered category for all users.
- The only way to fix it is to flush the cache, but it will just break again when someone filters a page.
- Filtering a category page is extremely common user behavior.
- This will severely impact user experience and, ultimately, revenue for merchants.

In my opinion, releasing v1.14.3.2 with SUPEE-9465 included should be a top priority for Magento. Put plainly the latest version of Magento Enterprise contains a very high severity defect.

### Conclusion

Hopefully this post help save a few people from time and money debugging this issue. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.