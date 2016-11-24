---
layout: blog-single
title: "5 Enterprise_PageCache Missing Features"
description: What can't Enterprise_PageCache do that it *should* be able to do? This post dives into the module's critical missing features.
date: October 27, 2016
tags: [magento, caching, scaling]
---

A while back I published [a post on improving your full page cache hit rate](https://maxchadwick.xyz/blog/monitoring-magento-fpc-hit-rate). In a conversation on Twitter, I was asked to provide suggestions on what Magento can do to improve hit rates.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/maxpchadwick">@maxpchadwick</a> Do you have suggestions on what we can do to improve cache hit rates?</p>&mdash; Blue_Bovine (@Blue_Bovine) <a href="https://twitter.com/Blue_Bovine/status/743819564983672832">June 17, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Riding on the coattails of [my previous listicle, 5 Enterprise Page Cache Pro Tips](https://maxchadwick.xyz/blog/5-enterprise-pagecache-pro-tips), I decided to publish a post in response. However, I've broadened the subject from "What can Magento do to improve hit rates?" to "What can Magento do to improve the `Enterprise_PageCache` module". Based on my experience working with the module, these are the top 5 missing features that I've identified...

<!-- excerpt_separator -->

### 1. Query parameter black list

**Problem**

Digital marketing tool such as ESPs and digital advertising platform add [unique identifiers](https://www.wordstream.com/gclid) [for each URL](https://www.google.com/search?q=_bta_tid) [they generate](https://www.google.com/search?q=mc_cid). Because these identifiers are unique, it is guaranteed that the response will not be able to come from cache. 

Further, these platforms introduce many additional query parameters (e.g. [`utm_*`](https://en.wikipedia.org/wiki/UTM_parameters)) which are not needed on the server. These will quickly balloon your cache storage space requirements, and make it more likely that a request will surpass the "max depth setting".

**Solution**

The solution to this problem is the strip unnecessary query parameters from the URL (e.g. `$_GET` superglobal) before `Enterprise_PageCache` generates the cache ID for the response.

We have published [a free module](https://github.com/sdinteractive/SomethingDigital_PageCacheParams) at Something Digital which solves this problem.    

### 2. Control over size management strategy

**Problem**

The cache size management strategy of `Enterprise_PageCache` is as follows...

- A "max cache size" setting is available through the admin
- The size of the current full page cache storage is tracked (in the full page cache) by measuring the size (in bytes) of each response.
- When `Enterprise_PageCache` saves the response, it doesn't set any expiry
- Once the current cache size exceeds the max cache size, all new saves are rejected and the cache is marked as "invalid" in the admin.

There are a number of problems with this approach...

- Because no expiry is set, even if a document is only accessed once ever, it will stay in cache forever (until the entire cache is cleared)
- Because writes are rejected after the current size exceeds the maximum size, if a surge of traffic comes to a URL while the application is in this state, it will all miss the cache

**Solution**

[A feature (which I authored) was added to `Cm_Cache_Backend_Redis` recently](https://github.com/colinmollenhour/Cm_Cache_Backend_Redis/pull/111) which gives more control over the cache size management strategy. It allows you to...

- Set an expiry when writing to FPC (even though `Enterprise_PageCache` doesn't)
- Refresh the TTL on access (keeps the cache primed with things that are being accessed most frequently).

This is a step in the right direction, but ideally I would like the ability to control expiry on a route-by-route basis per [this gist](https://gist.github.com/mpchadwick/0265e75241b7c1440f3521d78472ae43). I'll get to why that is important in point 4.

### 3. Ability to create additional cache entries based on custom cookies

**Problem**

Magento creates unique cache entries for a given URL based on cookies. This enables functionality such as group pricing and catalog price rules. However, it may be desirable to create additional cache entries based on cookies that are introduced by 3rd party modules or custom code. Recently, I had to rewrite the `Enterprise_PageCache` request processor to make a feature work which marked down prices on the front end for visitors entering with certain URL query parameters.

**Solution**

Ideally, the method in Magento which generates the cache key would, in addition to using the out-of-box cookies, allow for some means of configuration for varying cache entries based on custom cookies. There is some additional complexity in the interaction of these cookies with containers.

### 4. Caching for search results page

**Problem**

Out of the box Magento caches the typical high throughput routes such as `catalog/category/view` and `catalog/product/view`. However, it doesn't cache `catalogsearch/result/index`. I'm guessing the thinking behind this was something like..."Search results are highly disparate, so hit rate will be very low. It is not worth caching the search results page." However, on the flip side of that, it is entirely feasible that a link to a single search results page could be used by a marketing team or shared via a social channel and get a high volume of traffic, which many sites would not be able to withstand without a layer of caching.

**Solution**

The search results page should be cached, but should have a short TTL. This will prevent the storage requirements from ballooning, but take a lot of pressure off the servers to withstand a burst of traffic to a single search results page.

### 5. Hit Rate Monitoring

**Problem**

Cache hit rate is a critical piece of information when monitoring the health of your application. Varnish has [built in hit rate monitoring via `varnishstat`](https://www.varnish-cache.org/docs/trunk/reference/varnishstat.html) and [Cloudflare has an analytics suite built into all accounts](https://www.cloudflare.com/analytics/). Using `Enterprise_PageCache` there is no way to understand what percentage of requests are coming from cache.

**Solution**

I have [an entire blog post which outlines a solution](https://maxchadwick.xyz/blog/monitoring-magento-fpc-hit-rate) (as mentioned, that post is what sparked this list). Ultimately, you'll be using [this free module](https://github.com/mpchadwick/Mpchadwick_PageCacheHitRate).

### Conclusion

If you have any comments, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
