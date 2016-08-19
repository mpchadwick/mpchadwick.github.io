---
layout: blog-single
title: 5 Enterprise_PageCache Pro Tips
description: 5 Pro Tips for working with Magento 1's Enterprise_PageCache module
date: August 19, 2016
comments: true
noNameInTitle: true
---

I recently gave [a talk on monitoring and improving your full page cache hit rate with `Enterprise_PageCache` at NomadMage](https://nomadmage.com/monitoring-improving-full-page-cachehit-rate-enterprise_pagecache/). The talk dives deep into the internal's of `Enterprise_PageCache`, investigating how requests are saved to and loaded from cache. In this post, I wanted to highlight 5 key aspects of FPC that are revealed in the talk.

<!-- excerpt_separator -->

> **NOTE** The talk covers a lot more than just these 5 items. [Slide can be found here](http://maxchadwick.xyz/monitoring-and-improving-fpc-hit-rate).

### 1. FPC Doesn't Expire

When `Enterprise_PageCache` saves a request response **it will never expire**. There is [a lot of misinformation about this](http://magento.stackexchange.com/questions/741/when-does-ee-fpc-expire/124532). Requests are saved to cache by `Enterprise_PageCache_Model_Processor::processRequestResponse()`. In the following line of code...

```php?start_inline=1
$cacheInstance->save($content, $cacheId, $this->getRequestTags());
```

This will call the `Mage_Core_Model_Cache::save()`, which looks like this...

```php?start_inline=1
public function save($data, $id, $tags = array(), $lifeTime = null)
{
    if ($this->_disallowSave) {
        return true;
    }

    /**
     * Add global magento cache tag to all cached data exclude config cache
     */
    if (!in_array(Mage_Core_Model_Config::CACHE_TAG, $tags)) {
        $tags[] = Mage_Core_Model_App::CACHE_TAG;
    }
    return $this->getFrontend()->save((string)$data, $this->_id($id), $this->_tags($tags), $lifeTime);
}
```
`Enterprise_PageCache_Model_Processor` doesn't pass a `$lifeTime`, so `$lifeTime` defaults to `null`, which propagates to the backend and leads to the response being saved with no expiry. For example, take a look at `Zend_Cache_Backend_Apc::save()`...

```php?start_inline=1
public function save($data, $id, $tags = array(), $specificLifetime = false)
{
    $lifetime = $this->getLifetime($specificLifetime);
    $result = apc_store($id, array($data, time(), $lifetime), $lifetime);
    return $result;
}
```

`$specificLifetime` **was** passed as `null` by `Mage_Core_Model_Cache::save()`, it **does not** default to false. Therefore `Zend_Cache_Backend::getLifetime()` which can be seen below does not return the lifetime directive value.

```php?start_inline=1
public function getLifetime($specificLifetime)
    {
        if ($specificLifetime === false) {
            return $this->_directives['lifetime'];
        }
        return $specificLifetime;
    }
```

### 2. The _Entire_ Cache Is Invalidated Once It Get's Bigger Than The Maximum Cache Size

Re-focusing out attention on `Enterprise_PageCache_Model_Processor::processRequestResponse()` you will find the following code...

```php?start_inline=1
$contentSize = strlen($content);
$currentStorageSize = (int) $cacheInstance->load(self::CACHE_SIZE_KEY);

$maxSizeInBytes = Mage::getStoreConfig(self::XML_PATH_CACHE_MAX_SIZE) * 1024 * 1024;

if ($currentStorageSize >= $maxSizeInBytes) {
    Mage::app()->getCacheInstance()->invalidateType('full_page');
    return $this;
}

$cacheInstance->save($content, $cacheId, $this->getRequestTags());

$cacheInstance->save(
    $currentStorageSize + $contentSize,
    self::CACHE_SIZE_KEY,
    $this->getRequestTags()
);
```

As you can see, if the current size of  the storage (maintained in `FPC_CACHE_SIZE_CAHCE_KEY`) is larger than the maximum size as set in `system/page_cache/max_cache_size` the response is not saved and the entire full page cache is invalidated. Otherwise the content is saved and `FPC_CACHE_SIZE_CAHCE_KEY ` is updated. 

As far as I can tell, the cache being invalid doesn't do anything other than show a notification in the admin area, but as shown above new writes to cache will be no longer be possible.

### 3. No Cache Containers Are Harmful

When hole punching FPC it's tempting to just add a container that is fully uncached. Doing so does not require any thought about the circumstances under which a given element can be re-used. There are a few guides that you'll land on through Google searches that outline approach. **This is bad**.

I draw you're attention to `Enterprise_PageCache_Model_Processor::processContent()`, the method which tries to fill in the placeholders from the cached HTML document.

```php?start_inline=1
$containers = $this->_processContainers($content);
$isProcessed = empty($containers);

if ($isProcessed) {
    return $content;
} else {
    Mage::register('cached_page_content', $content);
    Mage::register('cached_page_containers', $containers);
    Mage::app()->getRequest()
        ->setModuleName('pagecache')
        ->setControllerName('request')
        ->setActionName('process')
        ->isStraight(true);

    // restore original routing info
    $routingInfo = array(
        'aliases'              => $this->getMetadata('routing_aliases'),
        'requested_route'      => $this->getMetadata('routing_requested_route'),
        'requested_controller' => $this->getMetadata('routing_requested_controller'),
        'requested_action'     => $this->getMetadata('routing_requested_action')
    );

    Mage::app()->getRequest()->setRoutingInfo($routingInfo);
    return false;
}
```

As you can see, if it can't fill in all the containers (result of `_processContainers`) it will return false, which bubbles back to the following code in `Mage_Core_Model_App::run()` returning `false`.

```php?start_inline=1
$this->_cache->processRequest()
```

This means that we don't *truly* have an FPC hit (we call this a "partial" hit at Something Digital). **Putting a no cached container on every pages guarantees that you'll never get any true FPC hits.**

### 4. If a Request Has More Query Parameters Than The Max Depth, It Won't Be Cached

Next, I draw your attention to `Enterprise_PageCache_Model_Processor::canProcessRequest()`, which is a method `Enterprise_PageCache` uses to determine whether or not it will cache a given request. In it you'll find the following lines...

```php?start_inline=1
$maxDepth = Mage::getStoreConfig(self::XML_PATH_ALLOWED_DEPTH);
$queryParams = $request->getQuery();
unset($queryParams[Enterprise_PageCache_Model_Cache::REQUEST_MESSAGE_GET_PARAM]);
$res = count($queryParams)<=$maxDepth;

return $res;
```

As you can see, this method compares the number of query parameters in the request to the "allowed depth" (aka "Max Depth") setting, and if there are more, **it won't cache the request.**

Note that the default value for that setting is 1.

```xml
<page_cache>
    <allowed_depth>1</allowed_depth>
    <multicurrency>1</multicurrency>
    <max_cache_size>1024</max_cache_size>
</page_cache>
```

This mean that if you get a bunch of traffic that looks like this and you don't change that setting, none of it will hit the FPC...

```
www.example.com?utm_term=bad&utm_content=times&utm_campaign=now
```

### 5. Requests For A Single URL Have Multiple Cache Entries Based On Cookies

Finally, I draw your attention to `Enterprise_PageCache_Model_Processor::_createRequestIds`, the method which generates the cache key for a given request. In it you'll see...

```php?start_inline=1
$uri = $this->_getFullPageUrl();

//Removing get params
$pieces = explode('?', $uri);
$uri = array_shift($pieces);

/**
 * Define COOKIE state
 */
if ($uri) {
    if (isset($_COOKIE[Mage_Core_Model_Store::COOKIE_NAME])) {
        $uri = $uri.'_'.$_COOKIE[Mage_Core_Model_Store::COOKIE_NAME];
    }
    if (isset($_COOKIE['currency'])) {
        $uri = $uri.'_'.$_COOKIE['currency'];
    }
    if (isset($_COOKIE[Enterprise_PageCache_Model_Cookie::COOKIE_CUSTOMER_GROUP])) {
        $uri .= '_' . $_COOKIE[Enterprise_PageCache_Model_Cookie::COOKIE_CUSTOMER_GROUP];
    }
    if (isset($_COOKIE[Enterprise_PageCache_Model_Cookie::COOKIE_CUSTOMER_LOGGED_IN])) {
        $uri .= '_' . $_COOKIE[Enterprise_PageCache_Model_Cookie::COOKIE_CUSTOMER_LOGGED_IN];
    }
    if (isset($_COOKIE[Enterprise_PageCache_Model_Cookie::CUSTOMER_SEGMENT_IDS])) {
        $uri .= '_' . $_COOKIE[Enterprise_PageCache_Model_Cookie::CUSTOMER_SEGMENT_IDS];
    }
    if (isset($_COOKIE[Enterprise_PageCache_Model_Cookie::IS_USER_ALLOWED_SAVE_COOKIE])) {
        $uri .= '_' . $_COOKIE[Enterprise_PageCache_Model_Cookie::IS_USER_ALLOWED_SAVE_COOKIE];
    }
}

$this->_requestId       = $uri;
$this->_requestCacheId  = $this->prepareCacheId($this->_requestId);
```

This means the for a given URL, there are separate FPC entries for (amongst other things) each customer group / customer segment combination.

<hr><br>

Hope you found these tips helpful. Leave a comment below with any questions or comments.