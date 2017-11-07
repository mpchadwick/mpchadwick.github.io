---
layout: blog-single
title:  Magento Config Cache Stampeding Race Condition
description: An investigation of a core race condition bug that can lead to cache stampeding preventing the config cache from working at all.
date: October 30, 2017
image: /img/blog/magento-1-config-cache-stampeding-race-condition/response-time@1x.jpg
tags: [Magento]
---

It started with an alert. 

CPU usage had climbed to above 80% on the web servers. Additionally, average response time had spiked.

<img
  class="rounded shadow"
  src="/img/blog/magento-1-config-cache-stampeding-race-condition/response-time@1x.jpg"
  srcset="/img/blog/magento-1-config-cache-stampeding-race-condition/response-time@1x.jpg 1x, /img/blog/magento-1-config-cache-stampeding-race-condition/response-time@2x.jpg 2x"
  alt="New Relic response time spike as a response of cache stampeding">

In New Relic APM Pro, we could see in some slow transaction traces that the server was busy loading XML configurations...which should've been coming from cache.

After a few hours of investigation, we found that the issue was due to a core bug which can result in [cache stampeding](https://en.wikipedia.org/wiki/Cache_stampede) due to a race condition when the site is under high load.

Let's dive into the issue.

<!-- excerpt_separator -->

### How It Happens

The opportunity for cache stampeding is present in `Mage_Core_Model_Config::saveCache()`. Here's the full method as of 1.9.3.6...

```php?start_inline=1
public function saveCache($tags=array())
{
    if (!Mage::app()->useCache('config')) {
        return $this;
    }
    if (!in_array(self::CACHE_TAG, $tags)) {
        $tags[] = self::CACHE_TAG;
    }
    $cacheLockId = $this->_getCacheLockId();
    if ($this->_loadCache($cacheLockId)) {
        return $this;
    }
    if (!empty($this->_cacheSections)) {
        $xml = clone $this->_xml;
        foreach ($this->_cacheSections as $sectionName => $level) {
            $this->_saveSectionCache($this->getCacheId(), $sectionName, $xml, $level, $tags);
            unset($xml->$sectionName);
        }
        $this->_cachePartsForSave[$this->getCacheId()] = $xml->asNiceXml('', false);
    } else {
        return parent::saveCache($tags);
    }
    $this->_saveCache(time(), $cacheLockId, array(), 60);
    $this->removeCache();
    foreach ($this->_cachePartsForSave as $cacheId => $cacheData) {
        $this->_saveCache($cacheData, $cacheId, $tags, $this->getCacheLifetime());
    }
    unset($this->_cachePartsForSave);
    $this->_removeCache($cacheLockId);
    return $this;
}
```

The method uses a lock, which should ideally prevent stampeding...

```php?start_inline=1
$cacheLockId = $this->_getCacheLockId();
if ($this->_loadCache($cacheLockId)) {
    return $this;
}
```

However, not only is this not atomic, but it also executes a bunch of code before it saves the lock...

```php?start_inline=1
$cacheLockId = $this->_getCacheLockId();
if ($this->_loadCache($cacheLockId)) {
    return $this;
}

// Save cache sections...

$this->_saveCache(time(), $cacheLockId, array(), 60);
```

Due to these faulty locking mechanics, the following race condition is possible...

- Request A comes in. The config cache is cold. It hits `Mage_Core_Model_Config::saveCache()`
- Request A checks if the config cache is locked for saving. It's not.
- Request A begins saving cache sections
- Request B comes in. The config cache is still cold (Request A hasn't saved it yet). It also hits `Mage_Core_Model_Config::saveCache()`.
- Request B checks if the config cache is locked for saving. It's not (Request A hasn't saved the lock yet).
- Request A finishes saving sections and now saves the lock. However, Request B already got past the lock check and it is also able to proceed with cache saving.

Under high throughput, the same pattern repeats itself ad nauseam with Request C, Request D, Request E and so on.

While the race condition is not ideal, the real problem is the cache stampeding it causes. This happens because `Mage_Core_Model_Config::saveCache()` clears the config cache before it saves...

```php?start_inline=1
$this->removeCache();
```
As a result, under high throughput a backlog of requests will repeatedly clear the cache creating a stampeding effect preventing the config cache from working at all.

<img
  class="rounded shadow"
  src="/img/blog/magento-1-config-cache-stampeding-race-condition/redis-del@1x.jpg"
  srcset="/img/blog/magento-1-config-cache-stampeding-race-condition/redis-del@1x.jpg 1x, /img/blog/magento-1-config-cache-stampeding-race-condition/redis-del@2x.jpg 2x"
  alt="Redis DEL throughput spike due to cache stampeding race condition">

### What Can I Do?

In the heat of the moment, to resolve the issue while it was in progress we temporarily commented out the `removeCache` call in `Mage_Core_Model_Config::saveCache()` to allow the cache to save, and then reverted our changes. Response time immediately stabilized.

<img
  class="rounded shadow"
  src="/img/blog/magento-1-config-cache-stampeding-race-condition/response-time-stabilize@1x.jpg"
  srcset="/img/blog/magento-1-config-cache-stampeding-race-condition/response-time-stabilize@1x.jpg 1x, /img/blog/magento-1-config-cache-stampeding-race-condition/response-time-stabilize@2x.jpg 2x"
  alt="New Relic response time stabilizing after resolving cache stampeding">

Upon further research, however, I found that [Colin Mollenhour](https://twitter.com/colinmollenhour?lang=en), author of several significant parts of Magento core code including [Cm_Cache_Backend_Redis](https://github.com/colinmollenhour/Cm_Cache_Backend_Redis) and [Cm_RedisSession](https://github.com/colinmollenhour/Cm_RedisSession) published [a patched version of `Mage_Core_Model_Config` that fixes this issue](https://gist.github.com/colinmollenhour/7a91c4a92ccfd2adaeb6). 

His patch was packaged up as [a composer installable component by Aligent](https://github.com/aligent/Cm_StampedeResistantConfig), which was subsequently [forked by magehost](https://github.com/magehost/Cm_StampedeResistantConfig). **The magehost fork includes compatibility with Magento 1.9.2.3 and SUPEE-7405 and is what you should apply at the time of publishing this.**

I'm not clear sure at this point if Magento has an official SUPEE patch for this issue. As such, I'd recommend applying Colin's patch to your code base, especially if your expecting high traffic this holiday season.