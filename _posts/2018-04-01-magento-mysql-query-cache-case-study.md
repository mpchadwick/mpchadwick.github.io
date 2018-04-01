---
layout: blog-single
title:  "Magento + MySQL Query Cache: A Case Study"
description: A look at the impact that MySQL query cache was having on a Magento 1.14 Enterprise production application
date: April 01, 2018
image: /img/blog/magento-query-cache-case-study/mysql-time@2x.jpg
tags: [Magento, MySQL]
---

The [MySQL query cache](https://dev.mysql.com/doc/refman/5.7/en/query-cache.html) is one of the most controversial MySQL features. While Percona concluded a blog post titled ["The MySQL query cache: Worst enemy or best friend?"](https://www.percona.com/blog/2015/08/07/mysql-query-cache-worst-enemy-best-friend/) by stating that "the MySQL query cache is a good fit" for [Magento](https://magento.com/), one of the world's leading ecommerce platforms, the MySQL team announced that [the query cache will be removed from MySQL 8.0](https://mysqlserverteam.com/mysql-8-0-retiring-support-for-the-query-cache/).

On the Magento 1.14 Enterprise Edition site of a client I work with at [Something Digital](https://www.somethingdigital.com/) the query cache was inadvertently disabled, and later re-enabled once the issue was caught. This gave us great visibility into the impact the query cache was having on this application. Here I'll share our findings...

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: Note the application in question was running Magento 1.14 Enterprise Edition</p>
</div>

### Some Background - Throughput By Database Operation

Before we take a look at the data, it's worthwhile to get a sense of how the application interacts with the database in terms of reads vs. writes. In ["The MySQL query cache: Worst enemy or best friend?"](https://www.percona.com/blog/2015/08/07/mysql-query-cache-worst-enemy-best-friend/), Percona described Magento's write workload as "light", but as you'll see in the graph below, that's really a bit of an understatement.

In fact, when looking a throughput by database operation, the INSERT, UPDATE and DELETE queries are barely visible in comparison the SELECT workload. 

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/database-operations-by-throughput@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/database-operations-by-throughput@1x.jpg 1x, /img/blog/magento-query-cache-case-study/database-operations-by-throughput@2x.jpg 2x"
  alt="A visualization of database operations by throughput">

While this graph just shows you the throughput for one specific Magento site (which has it's own set of customizations) looking at the same graph on other Magento sites looks more or less the same (for both Magento 1 and Magento 2).

Additionally, while it's not represented by this visualization, the SELECT queries Magento issues to the database are often quite complex. 

With this in mind, let's look at the impact the query cache had on this application.

### The Big Picture

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/big-picture-2@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/big-picture-2@1x.jpg 1x, /img/blog/magento-query-cache-case-study/big-picture-2@2x.jpg 2x"
  alt="1 month view from New Relic demonstrating impact of MySQL query cache.">

As you can see, when the query cache became disabled for this site, the performance of MySQL suffered severely. The average time spent on MySQL by the application increased from around 200ms per request to closer to around 500ms, a 2.5X increase. Here's another visualization that shows only time spend on MySQL by the application...

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/mysql-time@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/mysql-time@1x.jpg 1x, /img/blog/magento-query-cache-case-study/mysql-time@2x.jpg 2x"
  alt="1 month view from New Relic demonstrating impact of MySQL query cache, only showing time spent on MySQL.">

The query cache was very clearly having significant positive impact.

### Impact On Specific Queries

There were a few queries that benefited the most from the query cache.

For example, with the query cache on SELECTs against the `catalog_product_flat_1` table took an average of 1.39ms.

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/catalog-product-flat-1-select-query-cache-on@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/catalog-product-flat-1-select-query-cache-on@1x.jpg 1x, /img/blog/magento-query-cache-case-study/catalog-product-flat-1-select-query-cache-on@2x.jpg 2x"
  alt="A visualization time spend on SELECTs against catalog_product_flat_1 with query cache on">
  
However, with the query cache off **they too over 30X (:bangbang:) as long** with an average of 48ms, making them the most time consuming query.

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/catalog-product-flat-1-select-query-cache-off@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/catalog-product-flat-1-select-query-cache-off@1x.jpg 1x, /img/blog/magento-query-cache-case-study/catalog-product-flat-1-select-query-cache-off@2x.jpg 2x"
  alt="A visualization time spend on SELECTs against catalog_product_flat_1 with query cache off">
  
The second most pronounced case was SELECTs against `eav_attribute_option`. 

With the query cache on they took an average of 9.87ms.

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/eav-attribute-option-select-query-cache-on@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/eav-attribute-option-select-query-cache-on@1x.jpg 1x, /img/blog/magento-query-cache-case-study/eav-attribute-option-select-query-cache-on@2x.jpg 2x"
  alt="A visualization time spend on SELECTs against eav_option_select with query cache on">
  
However, with the query cache off **they took roughly 10X (:exclamation:) as long** with an average of 97.1ms.

<img
  class="rounded shadow"
  src="/img/blog/magento-query-cache-case-study/eav-attribute-option-select-query-cache-off@1x.jpg"
  srcset="/img/blog/magento-query-cache-case-study/eav-attribute-option-select-query-cache-off@1x.jpg 1x, /img/blog/magento-query-cache-case-study/eav-attribute-option-select-query-cache-off@2x.jpg 2x"
  alt="A visualization time spend on SELECTs against eav_option_select with query cache off">
  
Performance for many other queries was significantly assisted by the query cache, but these two queries offered the best demonstration.
  
### Takeaways

With this in mind, it's clear that the query cache can sometimes be used to significantly improve application performance. As such, it's troubling that the MySQL team has chosen to sunset the feature.

In the ["MySQL 8.0: Retiring Support for the Query Cache"](https://mysqlserverteam.com/mysql-8-0-retiring-support-for-the-query-cache/) announcement, the MySQL team advocate the use of [ProxySQL](http://proxysql.com/) in cases where caching is desired. While ProxySQL looks really cool (I haven't actually used it) I do have serious concerns about the limitations of it's caching implementation, which only supports invalidations via TTL. Regardless of the solution, engineers at companies such as Magento need to become planning for the future as MySQL 8.0 will be here before you know it.

