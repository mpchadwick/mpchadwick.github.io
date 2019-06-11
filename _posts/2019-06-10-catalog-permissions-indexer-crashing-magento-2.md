---
layout: blog-single
title:  "Catalog Permissions Indexer Crashing Magento 2"
date: June 10, 2019
image: 
tags: [Magento]
---

I recently investigated an issue where running a full reindex would cause a Magento 2 site to crash. Of course it's not best practice to run full reindexes, however, at the same time, it should be possible to do them without crashing the entire website. In this post we'll explore the issue.

<!-- excerpt_separator -->

### Capturing `SHOW FULL PROCESSLIST`

We knew from New Relic that MySQL response time would become sluggish leading up to the crash. In order to determine why this was happening we took snapshots of output of the MySQL `SHOW FULL PROCESSLIST` statement while the reindex was in process.

In these snapshots we saw many long running queries in the following states:

- Opening tables
- exit open_tables()
- closing tables

Then at the beginning of it all we saw a `REPLACE INTO magento_catalogpermissions_index_product_replica ` query. During the last `SHOW FULL PROCESSLIST` captured the query had been running for 10.5 minutes and was still in an "Opening tables state".

### Examining the `REPLACE INTO` Query

Upon closer inspection, it quickly became apparent that `REPLACE INTO` query was highly problematic. The query statement itself was 14MB (!!!) and resulted in 23,220 `JOIN`s across 1,934 `UNION`s.

We were able to deduce that the query was causing high contention for the [table cache](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_table_open_cache), causing table open / close operations to slow to a crawl.

### The Fix

We provided our findings to Magento support who were able to reproduce the issue and provided us with patch MDVA-16669. The patch modifies the internals of the Catalog Permissions indexer. We deployed the patch to production and confirmed it resolved the issue.
