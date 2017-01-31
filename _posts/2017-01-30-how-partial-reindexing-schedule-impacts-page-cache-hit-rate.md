---
layout: blog-single
title: How Partial Reindexing Schedule Impacts Page Cache Hit Rate
description: A look at how the schedule at which Magento's changelog based partial reindexing runs is directly tied to page cache hit rate.
date: January 30, 2017
image: 
tags: [magento, scaling, caching]
ad: domain-clamp-ad-b.html
---

One factor that impacts your Magento site's full page cache hit rate is your partial reindexing schedule. By partial reindexing, I mean execution of the `enterprise_refresh_index` job, which runs when the Magento cron is executed in "always" mode. 

Let's take a closer look at the interplay between partial reindexing and full page cache hit rate.


<!-- excerpt_separator -->

### Reindexing Impacts Full Page Cache?

Yes!

It is out of scope for this blog post to go too deep on Magento Enterprise's changelog based reindexing, but one file I'd like to draw your attention to is `Enterprise_CatalogInventory_Model_Index_Action_Refresh_Changelog`. Everytime `enterprise_refresh_index` runs it will call the `_reindex` method on this class (along with all the other changelog action models)  for any new records in the `cataloginventory_stock_status_cl` table.

You'll see that once it's done reindexing any products with inventory changes it dispatches an event and passes along the IDs of each product that was reindexed.

```php?start_inline=true
Mage::dispatchEvent('cataloginventory_stock_partial_reindex', array('product_ids' => $processIds));
```

Searching through the code base you'll see that `Enterprise_PageCache` is actually listening for that event.

```xml
<cataloginventory_stock_partial_reindex>
    <observers>
        <enterprise_pagecache>
            <class>enterprise_pagecache/observer_index</class>
            <method>cleanProductsCacheAfterPartialReindex</method>
        </enterprise_pagecache>
    </observers>
</cataloginventory_stock_partial_reindex>
```

As you can see, the `cleanProductsCacheAfterPartialReindex` method will be called, which, as you might guess, will clean the cache for any pages tagged with the reindexed products.

### How Does Schedule Fit Into The Equation?

Good question. Let me give you an example...

- There's a product on the site called "Gold Watch"
- Various pages throughout the site are "tagged" for this product
    - Jewelry category
    - Jewelry category with "gold" filter applied,
    - Jewelry > Watches category
    - Jewelry > Watches category with "gold" filter applied
    - Etc...
- The product is selling on average once per minute

In this example, if I were to run partial reindexing every 1 minute, all pages tagged for this product would be flushed each minute as a new entry would be in the changelog each time partial reindexing ran.

However, if I decreased my partial reindexing frequency to every 5 minutes, those tags would only be flushed once every 5 minutes. 

In other words, decreasing the frequency of partial reindexing can be used to dedupe cache invalidations (**NOTE**: I recommend you also install [`SomethingDigital_EnterpriseIndexPerf`](https://github.com/sdinteractive/SomethingDigital_EnterpriseIndexPerf) as out-of-box Magento does not dedupe entries in the changelog tables).

The net result of this is that information is more likely to be stale on the frontend, however end users are more likely to get cached responses.

### Build Ups

While decreasing the frequency partial indexing will ultimately increase your hit rate, decreasing it too much could be damaging. For example, let's say I set partial reindexing to run every hour. In that case, I would dedupe even more cache cleans than I did switching from one minutes to five minutes.

However, when partial reindexing would run each hour, there would be a large build up of products whose cache needed to be cleared. The net result of this would be a sudden burst of uncached responses.

Tune this setting carefully.

### A Case Study

With this in mind, we recently did an experiment at [Something Digital](http://www.somethingdigital.com/) decreasing the partial reindexing frequency from every one minute to every five minutes. Then, we compared the site's page cache hit rate for the week after the change to the week before the change.

The overall throughput was very close for each period (925,741 responses before  / 992,001 responses after). However, there was a 12% increase in responses coming from cache (partial of full) (37.50% before to 42.08% after)

<img
  class="rounded shadow"
  src="/img/blog/partial-reindexing-fpc-hit-rate/fpc-hit-rate-comparison@1x.jpg"
  srcset="/img/blog/partial-reindexing-fpc-hit-rate/fpc-hit-rate-comparison@1x.jpg 1x, /img/blog/partial-reindexing-fpc-hit-rate/fpc-hit-rate-comparison@2x.jpg 2x"
  alt="A chart demonstrating the increase in FPC hit rate">

### Leveraging This During An Emergency / High Traffic Scenario

During an emergency / high traffic scenario, one potential strategy could be to temporarily disable partial reindexing entirely. Then, when traffic quiets down and things stabilize, partial reindexing could be enabled (as mentioned above time this carefully). The frontend will be stale during this time, however, potentially, your infrastructure will be able to handle some additional throughput.

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.