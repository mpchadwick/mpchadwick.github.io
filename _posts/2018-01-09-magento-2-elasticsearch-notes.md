---
layout: blog-single
title:  "Magento 2 Elasticsearch Cheatsheet"
description: A catch all location for notes related to working with Elasticsearch in Magento 2
date: January 9, 2018
last_modified_at: May 14, 2018
image:
tags: [Magento, Elasticsearch]
related_posts:
- "Diff-ing MySQL and Elasticsearch"
- "Magento 2.3.5 + Content Security Policy (CSP): A Fool's Errand"
- "Working With The Magento 2 Page Cache The Right Way"
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

This assumes that the Elasticsearch index is running on `localhost` on port `9200`. The actual host / port on a given project can be confirmed in the database in the `core_config_data` table (or potentially in the `app/etc/env.php` file) at the following paths

- Host: `catalog/search/elasticsearch_server_hostname`
- Port: `catalog/search/elasticsearch_server_port`

### Determining Which Index is Being Used

The query may return a number of indexes.

Indexes follow the following format...

`magento2_product_{{store_id}}_v{{version_number}}`

As you can see, on a multi-store Magento instance a separate Elasticsearch index will be available for each store.

In terms of the version number, there should only be one index per store, but I have seen cases where indexes don't get deleted cleanly and there are old indexes lying around. Magento will query the highest version number for each store.

### Inspecting Indexed Data

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: All examples will be run against the example "magento2_product_1_v1" index. Replace the index as needed when running your queries...</p>
</div>

This request will match **any** indexed documents...

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
<p><strong>NOTE</strong>: When querying Elasticsearch it's important to understand the concept of  <a href="(https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html">analyzers</a>. If your product has a SKU of "SKU", Elasticsearch's analyzers will convert it to lowercase. Therefore, you need to search for "sku", not "SKU".</p>
</div>

There are a few ways you can do this. Here's the simplest (searching across all fields...)

**Request**

```
curl 'localhost:9200/magento2_product_1_v1/_search?pretty&q=sku'
```

**Response**

```
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

#### Search For Products Named T-Shirt

**Request**

This [`bool query`](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html) moves closer to the direction of how Magento queries Elasticsearch. Note the double-escaping of `t\\-shirt`. This is again due to analyzers. 

```
$ curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "name": {
              "query": "t\\-shirt"
            }
          }
        }
      ]
    }
  }
}
'
```

#### Queries With Multiple Words

By default Elasticsearch will do an "or" search when receiving a query with multiple words. If an "and" is desired this can be achieved by providing `and` as the `operator`...

**Request**

```
$ curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "name": {
              "query": "green t\\-shirt",
              "operator": "and"
            }
          }
        }
      ]
    }
  }
}
'
```

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: Magento does an "or" search. There's no way to change this out-of-box...</p>
</div>

#### Returning Specific Fields

By default Elasticsearch will return all the fields for each document. An array of fields can by provided to only retrieve specific ones...

**Request**

```
curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "fields": [
    "_id",
    "_score",
    "name",
    "sku"
  ],
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "name": {
              "query": "green t\\-shirt"
            }
          }
        }
      ]
    }
  }
}
'
```

#### `should` vs. `must`

So far the `bool` examples we've looked at all use `should` exclusively. When using `should` with multiple conditions a `minimum_should_match` can be used to define how many of the conditions need to match. Here's an example...

**Request**

```
curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "fields": [
    "_id",
    "_score",
    "name",
    "sku",
    "color"
  ],
  "query": {
    "bool": {
      "minimum_should_match": "1",
      "should": [
        {
          "match": {
            "name": {
              "query": "t\\-shirt"
            }
          }
        },
        {
          "match": {
            "color": {
              "query": "16"
            }
          }
        }
      ]
    }
  }
}
'
```

As the `minimum_should_match` is set to 1 either the name of the product can contain the string "t-shirt" or the color can be option id "16". Only one of those conditions need to be true. 

Setting the `minimum_should_match` to "100%" would require all the conditions to match.

Another way to achieve this is via a `must`. All conditions provided as `must`s must match (as you'd expect)...

**Request**

```
curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "fields": [
    "_id",
    "_score",
    "name",
    "sku",
    "color"
  ],
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "name": {
              "query": "t\\-shirt"
            }
          }
        },
        {
          "match": {
            "color": {
              "query": "16"
            }
          }
        }
      ]
    }
  }
}
'
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

Logged queries look something like this...

```
[2018-05-13 11:49:17,789][DEBUG][index.search.slowlog.query] [magento2-2-2-b2b-ee_product_1_v2]took[1.4ms], took_millis[1], types[document], stats[], search_type[QUERY_THEN_FETCH], total_shards[5], source[{"from":0,"size":"10000","fields":["_id","_score"],"query":{"bool":{"must":[{"term":{"category_ids":"4"}},{"terms":{"visibility":["2","4"]}}],"minimum_should_match":1}},"aggregations":{"price_bucket":{"extended_stats":{"field":"price_0_1"}},"category_bucket":{"terms":{"field":"category_ids"}},"manufacturer_bucket":{"terms":{"field":"manufacturer"}},"color_bucket":{"terms":{"field":"color"}}}}], extra_source[],
```
{:.wrap}

The actual query received can be found inside brackets after the word `source[`...

Note that Magento automatically renames the Elasticsearch index during a full catalog search reindex (as documented below), so these settings can go away...

### Index Version Naming

The version number is increased by when `Magento\Elasticsearch\Model\Adapter\Elasticsearch::cleanIndex()` is called.

### How Magento Queries Elasticsearch

#### Search Results Page

Below is an example of how Magento queries Elasticsearch when searching for the term "Product". Fields queried are determined by the "Use in Search" attribute property and the [boosts](https://www.elastic.co/guide/en/elasticsearch/guide/current/query-time-boosting.html) are determined by the "Search Weight" attribute property...

```
$ curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "aggregations": {
    "prices": {
      "histogram": {
        "field": "price_0_1",
        "interval": 1
      }
    }
  },
  "fields": [
    "_id",
    "_score"
  ],
  "from": 0,
  "query": {
    "bool": {
      "minimum_should_match": 1,
      "must": [
        {
          "terms": {
            "visibility": [
              "3",
              "4"
            ]
          }
        }
      ],
      "should": [
        {
          "match": {
            "sku": {
              "boost": 2,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "_all": {
              "boost": 2,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "name": {
              "boost": 6,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "description": {
              "boost": 11,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "short_description": {
              "boost": 2,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "manufacturer": {
              "boost": 2,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "color": {
              "boost": 2,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "status_value": {
              "boost": 2,
              "query": "product"
            }
          }
        },
        {
          "match": {
            "tax_class_id_value": {
              "boost": 2,
              "query": "product"
            }
          }
        }
      ]
    }
  },
  "size": "10000"
}
'
```

#### Category Pages

When Elasticsearch is configured as Magento's search engine, Elasticsearch will also be consulted to retrieve the product set while browsing category pages. Here's a query to return all the product in category "3" with color "12"

```
$ curl -H 'Content-Type: application/json' "localhost:9200/magento2_product_1_v1/_search?pretty" -d'
{
  "aggregations": {
    "prices": {
      "histogram": {
        "field": "price_0_1",
        "interval": 1
      }
    }
  },
  "fields": [
    "_id",
    "_score"
  ],
  "from": 0,
  "query": {
    "bool": {
      "minimum_should_match": 1,
      "must": [
        {
          "term": {
            "category_ids": "3"
          }
        },
        {
          "terms": {
            "visibility": [
              "2",
              "4"
            ]
          }
        },
        {
          "term": {
            "color": "13"
          }
        }
      ]
    }
  },
  "size": "10000"
}
'
```



