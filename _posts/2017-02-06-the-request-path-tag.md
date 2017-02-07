---
layout: blog-single
title: Magento's REQUEST_PATH FPC Tag
description: 
date: February 06, 2017
image: A look at the REQUEST_PATH tag, which is employed by Magento's Enterprise_PageCache module.
tags: [magento, caching]
ad: domain-clamp-ad-b.html
---

When Magento saves data to cache, it has the option to add "tags" to the data it is saving. This feature, which is [built into Zend Framework 1](https://framework.zend.com/manual/1.10/en/zend.cache.theory.html#zend.cache.tags), is particularly useful as it allows the application easily invalidate all data associated with a particular tag.

For example, when the name of a product changes, all pages on which that product was displayed can be invalidated by passing the appropriate tag to the cache instance's `clean` method. If the product with `entity_id` 1 had changed, cleaning all cache data would look like this...

```php?start_inline=1
Enterprise_PageCache_Model_Cache::getCacheInstance()
    ->clean('CATALOG_PRODUCT_1');
```

One tag that Magento's `Enterprise_PageCache` module makes uses of is the `REQUEST_PATH` tag. In this post, we'll first explore how Magento uses this tag out-of-box. Then, we'll take a look at how *we* can take advantage of this tag.

<!-- excerpt_separator -->

### How It Gets Added

If you look at the `processRequestResponse` method in `Enterprise_PageCache_Model_Processor` the first line of code you'll see looks something like this...

```php?start_inline=true
$this->addRequestTag(
    Enterprise_PageCache_Helper_Url::prepareRequestPathTag(
        $request->getOriginalPathInfo()
    )
);
```

`addRequestTag` simply updates the protected `$_requestTags` property with the specified tag(s). 

```php?start_inline=true
public function addRequestTag($tag)
{
    if (!is_array($tag)) {
        $tag = array($tag);
    }
    foreach ($tag as $value) {
        if (!in_array($value, $this->_requestTags)) {
            $this->_requestTags[] = $value;
        }
    }
    return $this;
}
```

Later, when `Enterprise_PageCache` saves the response, it will tag it with all the `$_requestTags`.

```php?start_inline=true
$cacheInstance->save(
    $content,
    $cacheId,
    $this->getRequestTags()
);
```

### Composition of the tag

Here's what `prepareRequestPathTag` looks like...

```php?start_inline=true
public static function prepareRequestPathTag($path)
{
    $path = trim((string)$path, '/ ');
    return Enterprise_PageCache_Model_Processor::REQUEST_PATH_PREFIX . md5($path);
}
```

Essentially, it just `md5`s the path portion of the URL. In other words...

1. User requests www.example.com/hello
2. "hello" is extracted from URL and `md5`-ed
3. Response cache entry is tagged with `REQUEST_PATH_5d41402abc4b2a76b9719d911017c592`

Notably, the query string is not considered when generating the `REQUEST_PATH` tag.

### What Does Magento Do With This?

If we look in `Enterprise_PageCache_Model_Observer` we'll see the following method...

```php?start_inline=true
public function clearRequestCacheByTag(Varien_Event_Observer $observer)
{
    if (!$this->isCacheEnabled()) {
        return $this;
    }
    $redirect = $observer->getEvent()->getRedirect();
    $this->_cacheInstance->clean(
        array(
            Enterprise_PageCache_Helper_Url::prepareRequestPathTag($redirect->getData('identifier')),
            Enterprise_PageCache_Helper_Url::prepareRequestPathTag($redirect->getData('target_path')),
            Enterprise_PageCache_Helper_Url::prepareRequestPathTag($redirect->getOrigData('identifier')),
            Enterprise_PageCache_Helper_Url::prepareRequestPathTag($redirect->getOrigData('target_path'))
        )
    );
    return $this;
}
```

Looking at the `config.xml` file in `Enterprise_PageCache` we can see that this method will be called when the following events fire...

- `rewrite_url_partial_reindex`
- `redirect_save_commit_after`
- `redirect_delete_commit_after`

Magento leverages this tag to clean the cache entries	 when URL redirects change.

### Why Should We Care About This?

Knowing about the `REQUEST_PATH` tag is useful as we can use it to flush a single page from the cache. For example, if we wanted to flush www.example.com/hello, we'd just have to do the following...

```php?start_inline=true
$tag = Enterprise_PageCache_Helper_Url::prepareRequestPathTag('hello');
Enterprise_PageCache_Model_Cache::getCacheInstance()->clean($tag);
```

This trick can avoid blowing away the entire full page cache in some cases.

### Conclusion

Hopefully some of you found learning about the the `REQUEST_PATH` tag to be interesting and useful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.