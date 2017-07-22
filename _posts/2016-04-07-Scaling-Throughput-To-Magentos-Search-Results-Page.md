---
layout: blog-single
title: Scaling Throughput to Magento’s Search Results Page
date: April 07, 2016
tags: [Magento, Scaling]
---

In my work at [Something Digital](http://somethingdigital.com/) I’ve recently taken a deep dive into profiling and improving performance, at scale, of the search results page (`/catalogsearch/result/index`). In our case, we have a client whose traffic profile is very search heavy, and ran into performance issues due to a traffic sure to that route. The investigation was very interesting, and I thought it would be beneficial to document some of the key findings here.

<!-- excerpt_separator -->

> NOTE: This post is **not** concerned with scalability concerns due to the usage of MySQL full text as a search engine. If you are running Magento Enterprise you should be using the out-of-box SOLR engine to power catalog search. If you are attempting to scale your throughput to your search results page using MySQL full text search you may have other issues.

### catalogsearch_query.synoynm_for

Our investigation initially started here. At the time of the incident we saw poor performance with the following query...


{% highlight sql %}
SELECT `catalogsearch_query`.* FROM `catalogsearch_query` WHERE (synonym_for=? OR query_text=?) AND (store_id=?) ORDER BY `synonym_for` ASC LIMIT ?
{% endhighlight %}

This query can be found in `Mage_CatalogSearch_Model_Resource_Query::loadByQuery()`. Essentially, what it’s doing is taking the user’s query and determining if there’s a synonym. If so, the synonym will be considered as the user’s query throughout the rest of the request rather than the original query.

The biggest problem here, is that, by default, the `synoynm_for` column is not indexed, however it is being used for both `WHERE` and `ORDER BY`.

By simply adding an index to the `synonym_for`, we were able to drastically improve the scalability of the page.

Here are some benchmarks:

**Time spent on `SELECT` without index on `synonym_for` (~200K records)**
{% highlight sql %}
mysql> SELECT SQL_NO_CACHE `catalogsearch_query`.*
    -> FROM `catalogsearch_query`
    -> WHERE (synonym_for='napkins' OR query_text='napkins')
    -> AND (store_id=1)
    -> ORDER BY `synonym_for` ASC LIMIT 1;
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
| query_id | query_text | num_results | popularity | redirect | synonym_for | store_id | display_in_terms | is_active | is_processed | updated_at          |
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
|  1584678 | napkins    |           3 |       1057 | NULL     | NULL        |        1 |                1 |         1 |            0 | 2016-04-07 19:47:13 |
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
1 row in set (0.22 sec)
{% endhighlight %}

**Time spent on `SELECT` with index on `synonym_for` (~200K records)**

{% highlight sql %}
mysql> SELECT SQL_NO_CACHE `catalogsearch_query`.*
    -> FROM `catalogsearch_query`
    -> WHERE (synonym_for='napkins' OR query_text='napkins')
    -> AND (store_id=1)
    -> ORDER BY `synonym_for` ASC LIMIT 1;
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
| query_id | query_text | num_results | popularity | redirect | synonym_for | store_id | display_in_terms | is_active | is_processed | updated_at          |
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
|  1584678 | napkins    |           3 |       1057 | NULL     | NULL        |        1 |                1 |         1 |            0 | 2016-04-07 19:47:13 |
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
1 row in set (0.10 sec)
{% endhighlight %}

As you can see, with the index we were essentially able to cut the time the query took in half.

### Rewriting Mage_CatalogSearch_Model_Resource_Query::loadByQuery()

The gains to be had simply by adding the index are drastic, however, one of my colleagues identified that this `SELECT` could be further optimized by using a `UNION` rather than a `WHERE OR`

We want to rewrite the query to look something like this

{% highlight sql %}
(SELECT  `catalogsearch_query`.* FROM `catalogsearch_query` WHERE synonym_for='bath tissue' AND (store_id=1)) UNION (SELECT `catalogsearch_query`.* FROM `catalogsearch_query` WHERE query_text='bath tissue' AND (store_id=1)) ORDER BY `synonym_for` ASC LIMIT 10;
{% endhighlight %}

The achieve this, the re-written `loadByQuery()` looks something like this

{% highlight php %}
<?php

public function loadByQuery(Mage_Core_Model_Abstract $object, $value)
{
    $select = $this->_getReadAdapter()->select()
        ->union(array(
            $this->loadByQueryPart('synonym_for', $object, $value),
            $this->loadByQueryPart('query_text', $object, $value)))
        ->order('synonym_for ASC')
        ->limit(1);

    if ($data = $this->_getReadAdapter()->fetchRow($select)) {
        $object->setData($data);
        $this->_afterLoad($object);
    }

    return $this;
}

protected function loadByQueryPart($part, $object, $value)
{
    return $this->_getReadAdapter()->select()
        ->from($this->getMainTable())
        ->where($part . '=?', $value)
        ->where('store_id=?', $object->getStoreId());
}
{% endhighlight %}

By adding the index and rewriting the query, we've virtually eliminated the time spent on this query.

**Time spent on `SELECT` with index on `synonym_for` AND using UNION (~200K records)**

{% highlight sql %}
mysql> (SELECT  `catalogsearch_query`.* FROM `catalogsearch_query` WHERE synonym_for='napkins' AND (store_id=1)) UNION (SELECT `catalogsearch_query`.* FROM `catalogsearch_query` WHERE query_text='napkins' AND (store_id=1)) ORDER BY `synonym_for` ASC LIMIT 10;
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
| query_id | query_text | num_results | popularity | redirect | synonym_for | store_id | display_in_terms | is_active | is_processed | updated_at          |
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
|  1584678 | napkins    |           3 |       1057 | NULL     | NULL        |        1 |                1 |         1 |            0 | 2016-04-07 19:47:13 |
+----------+------------+-------------+------------+----------+-------------+----------+------------------+-----------+--------------+---------------------+
1 row in set (0.00 sec)
{% endhighlight %}

### Mage_CatalogSearch_Model_Resource_Fulltext::resetSearchResults()

In the process of the investigation, we also found some windows where the following query was taking longer than usual

{% highlight sql %}
 UPDATE `catalogsearch_query` SET `query_text` = ?, `num_results` = ?, `popularity` = ?, `redirect` = ?, `synonym_for` = ?, `store_id` = ?, `display_in_terms` = ?, `is_active` = ?, `is_processed` = ?, `updated_at` = ? WHERE (query_id=?)
{% endhighlight %}

Essentially, the query record gets `UPDATE`d each time `/catalogsearch/result/index` is served. An example of why it needs to do this is to increment to “popularity” counter on the query record.

There’s nothing inherently wrong here, however it is curious that we found intermittent 5-10 minute intervals where response time on `/catalogsearch/result/index` tripled, and the time was being spent on this query.

As we dug in further we found that these windows correlated with store admin activity updating product records. There’s a good Stack Overflow thread related to this issue [here](http://magento.stackexchange.com/questions/53529/magento-enterprise-slow-product-save-w-and-wo-solr-integration). Essentially, product reindexes, among other things, kick off the following query...

{% highlight sql %}
UPDATE catalogsearch_query SET is_processed = '0'
{% endhighlight %}

There are a couple of (easy) ways this query can be optimized (both documented in the link above)

- Only `UPDATE` if `is_proccessed` is currently `!= 0`
- Add an index to `catalogsearch_query.is_proccessed`

If you read the link cited previously, you’ll see that Magento support officially stated that the solution is to update the index mode to “Index when scheduled”. I can appreciate that. We are using “Index when scheduled” on this site and pretty much every site at Something Digital. However, as was the case here, there are times when something out of your control (eg. extensions, poorly written custom code, other 3rd party tools) disregards that setting. As such it's still a good idea to make these changes as an extra safety measure.

Let’s see some benchmarks. We'll look at the most drastic scenario where `is_proccessed` is already 0 on 100% of the records (which is likely if you're using SOLR).

**~200K rows in catalogsearch_query 100% with is_proccessed 0 without optimizations**

{% highlight sql %}
mysql> UPDATE catalogsearch_query SET is_processed = 0;
Query OK, 0 rows affected (0.48 sec)
Rows matched: 188696  Changed: 0  Warnings: 0
{% endhighlight %}

**~200K rows in catalogsearch_query 100% with is_proccessed 0 with optimizations**
{% highlight sql %}
mysql> UPDATE catalogsearch_query SET is_processed = 0 WHERE is_processed != 0;
Query OK, 0 rows affected (0.00 sec)
Rows matched: 0  Changed: 0  Warnings: 0
{% endhighlight %}

### catalogsearch_query table cleaning

One last thing we did (actually this was in place before any of this investigation occurred due to past performance issues) was to add a cron job to periodically trim down the size of the `catalogsearch_query` table, which can get very large on a search heavy site. In our case we regularly clear out all records with popularity < 25. If retaining *all* the data is important to you, you can also back up the table before running the job.

This was initially extremely important for us before we took the deep dive above to identify the underlying issues, but now that we’ve fixed them, it doesn’t appear to be *as* important. That being said, it is still recommended as the table will only continue to grow over time.

### Note About Magento 2

Of note is the fact most of these issues appear to be solved in Magento 2.

- [synonym_for is indexed](https://github.com/magento/magento2/blob/6ea7d2d85cded3fa0fbcf4e7aa0dcd4edbf568a6/app/code/Magento/Search/Setup/InstallSchema.php#L122-L125)
- synonym_for is [actually not even used in `loadByQuery()` (or it’s M2 equivalent `loadByQueryText()`](https://github.com/magento/magento2/blob/6ea7d2d85cded3fa0fbcf4e7aa0dcd4edbf568a6/app/code/Magento/Search/Model/ResourceModel/Query.php#L51-L77) anymore, so we don't need to worry about the `WHERE OR`
- [`resetSearchResults()` skips rows where `is_processed !=0`](https://github.com/magento/magento2/blob/6ea7d2d85cded3fa0fbcf4e7aa0dcd4edbf568a6/app/code/Magento/CatalogSearch/Model/ResourceModel/Fulltext.php#L52) and [there is an index on `is_processed` column](https://github.com/magento/magento2/blob/6ea7d2d85cded3fa0fbcf4e7aa0dcd4edbf568a6/app/code/Magento/Search/Setup/InstallSchema.php#L118-L121). There’s also [a closed GitHub issue](https://github.com/magento/magento2/issues/566) about this.

The only thing that could still be necessary is cleaning the `catalogsearch_query` table.
