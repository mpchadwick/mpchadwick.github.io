---
layout: blog-single
title:  "Magento 2 Elasticsearch Notes"
description: A catch all location for notes related to working with Elasticsearch in Magento 2
date: January 9, 2018
image:
tags: [Magento]
---

This post is a catch all location for my notes on working with Elasticsearch in Magento 2. It will be continually updated as I continue to spend more time with Elasticsearch.

<!-- excerpt_separator -->

### Get A List Of Indexes

This request will display a list of **all** indexes.

```
$ curl 'localhost:9200/_cat/indices?v'
health status index                           pri rep docs.count docs.deleted store.size pri.store.size
yellow open   magento2_product_1_v1             5   1          1            0      7.5kb          7.5kb
```

### Inspecting Indexed Data

This request will match **any** indexed documents.

```
$ curl 'localhost:9200/magento2_product_1_v1/_search?pretty&q=*:*'
{
  "took" : 3,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 1.0,
    "hits" : [ {
      "_index" : "magento2_product_1_v1",
      "_type" : "document",
      "_id" : "1",
      "_score" : 1.0,
      "_source" : {
        "store_id" : "1",
        "created_at" : "2018-01-10T01:53:24+00:00",
        "gift_message_available" : "2",
        "gift_message_available_value" : "Use config",
        "gift_wrapping_available" : "2",
        "gift_wrapping_available_value" : "Use config",
        "is_returnable" : "2",
        "is_returnable_value" : "",
        "meta_description" : "Test ",
        "meta_keyword" : "Test",
        "meta_title" : "Test",
        "name" : "Test",
        "options_container" : "container2",
        "options_container_value" : "Block after Info Column",
        "quantity_and_stock_status_value" : "In Stock",
        "sku" : "Test",
        "status" : "1",
        "status_value" : "Enabled",
        "tax_class_id" : "2",
        "tax_class_id_value" : "Taxable Goods",
        "updated_at" : "2018-01-10T01:53:24+00:00",
        "url_key" : "test",
        "visibility" : "4",
        "visibility_value" : "Catalog, Search",
        "weight" : "1.0000",
        "is_in_stock" : 1,
        "qty" : 999,
        "price_0_1" : "1.000000",
        "price_1_1" : "1.000000",
        "price_2_1" : "1.000000",
        "price_3_1" : "1.000000",
        "category_ids" : "2",
        "position_category_2" : "0",
        "name_category_2" : "Default Category"
      }
    } ]
  }
}
```

By default it will return 10 documents.

#### Search By SKU

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: When querying Elasticsearch it's important to understand the concept of  <a href="(https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html">analyzers</a>. If you're product has a SKU of "SKU", Elasticsearch's analyzers will convert it to lowercase, you need to search for "sku", not "SKU".</p>
</div>

```
$ curl "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "query": {
    "term": {
      "sku": "sku"
    }
  }
}
'
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 0.30685282,
    "hits" : [ {
      "_index" : "magento2_product_1_v1",
      "_type" : "document",
      "_id" : "1",
      "_score" : 0.30685282,
      "_source" : {
        "store_id" : "1",
        "sku" : "SKU",
        "status_value" : "Enabled",
        "status" : "1",
        "visibility_value" : "Catalog, Search",
        "visibility" : "4",
        "tax_class_id_value" : "Taxable Goods",
        "tax_class_id" : "2",
        "name" : "Product",
        "category_ids" : "2 3",
        "position_category_2" : "0",
        "name_category_2" : "Default Category",
        "position_category_3" : "0",
        "name_category_3" : "My Category",
        "price_0_1" : "1.000000",
        "price_1_1" : "1.000000",
        "price_2_1" : "1.000000",
        "price_3_1" : "1.000000",
        "price_4_1" : "1.000000"
      }
    } ]
  }
}
```

### Viewing A Query Log

It appears that the best option for viewing a query log is to decrease the the slowlog threshold to "0s". This can be done at runtime without restarting Elasticsearch.

```
$ curl -XPUT "http://localhost:9200/magento2_product_1_v1/_settings" -d'
{
    "index.search.slowlog.threshold.query.debug": "0s"
}'
```

The location for log files is defined by the `path.logs` configuration value in `elasticsearch.yml`.

Reference: [Logging Requests to Elasticsearch](http://blog.florian-hopf.de/2016/03/logging-requests-to-elasticsearch.html)

### Index Version Naming

The version number is increased by when `Magento\Elasticsearch\Model\Adapter\Elasticsearch::cleanIndex()` is called.






