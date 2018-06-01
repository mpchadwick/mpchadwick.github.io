---
layout: blog-single
title:  "Simulating an Elasticsearch Timeout"
description: My findings while attempting to simulate an Elasticsearch timeout.
date: May 31, 2018
image:
tags: [Elasticsearch]
---

Recently I submitted a [contribution to the Magento 2 project](https://github.com/magento/magento2/pull/15592) to terminate requests to Elasticsearch if they exceed the configured "timeout" setting. This was done in response to a production issue experienced on a client's site where Elasticsearch slowdowns (due to a misconfigured [maximum heap size](https://www.elastic.co/guide/en/elasticsearch/reference/current/heap-size.html)) would take an entire website down.

Basically, what was happening is that the PHP processes that were waiting for Elasticsearch responses would continue to build up until the server resources were exhausted. This would block workflows on the site that didn't require Elasticsearch such as placing orders, wishlist / shopping cart management or administrative workflows.

In order to test this feature out, I wanted to simulate an Elasticsearch timeout. Turns out this is a lot harder than one would think. Here I'll document my findings...

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This post was authored based on Elasticsearch version 2.3.3. Behavior described below may vary in other Elasticsearch versions.</p>
</div>

### Googling

My first course of action was to do some Googling for phrases likes "elasticsearch simulate timeout" and "elasticsearch simulate slow response". This lead me to the article ["Six Ways to Crash Elasticsearch"](https://www.elastic.co/blog/found-crash-elasticsearch) on [the elastic.co blog](https://www.elastic.co/blog). There I found the following example...

```
{
    "script_fields": {
        "test1": {
            "lang": "groovy",
            "script": "while (true) {print 'Hello world'}"
        }
    }
}
```

The `while (true)` piqued my interest for sure...this would most certainly be an infinite loop. I decided to do some experimentation

### Testing The Infinite Loop

Outside of the JSON snippet, the example from "Six Ways to Crash Elasticsearch" didn't specify exactly how to run the example query, so I had to do a little experimentation. First I tried the below...

**Request**

```
curl "localhost:9200/magento2-2-2-b2b-ee_product_1_v2/_search?pretty" -d'
{
    "script_fields": {
        "test1": {
            "lang": "groovy",
            "script": "while (true) {print 'Hello World'}"
        }
    }
}'
```

Sending that off to my local Elasticsearch instance I got the following response...

**Response**

```
{
  "error" : {
    "root_cause" : [ {
      "type" : "json_parse_exception",
      "reason" : "Unexpected end-of-input in VALUE_STRING\n at [Source: [B@702a79ac; line: 6, column: 172]"
    } ],
    "type" : "search_phase_execution_exception",
    "reason" : "all shards failed",
    "phase" : "query",
    "grouped" : true,
    "failed_shards" : [ {
      "shard" : 0,
      "index" : "magento2-2-2-b2b-ee_product_1_v2",
      "node" : "gH9K5vt5QOaWaREP4fwkzw",
      "reason" : {
        "type" : "json_parse_exception",
        "reason" : "Unexpected end-of-input in VALUE_STRING\n at [Source: [B@702a79ac; line: 6, column: 172]"
      }
    } ]
  },
  "status" : 500
}
curl: (3) [globbing] unmatched close brace/bracket in column 6
```

Unfortunately the single quote from `"script": "while (true) {print 'Hello World'}"` broke out of the single quotes used to enclose the request body.

Using the "copy as curl" feature on [the Elasticsearch Script Fields documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-script-fields.html) I learned that I'd need to express the single quote in unicode with`\u0027`. As such, next I tried the following...

**Request**

```
curl "localhost:9200/magento2-2-2-b2b-ee_product_1_v2/_search?pretty" -d'
{
    "script_fields": {
        "test1": {
            "lang": "groovy",
            "script": "while (true) {print \u0027Hello World\u0027}"
        }
    }
}'
```

This query gave me back the following response...

**Response**

```
{
  "error" : {
    "root_cause" : [ {
      "type" : "script_exception",
      "reason" : "scripts of type [inline], operation [search] and lang [groovy] are disabled"
    } ],
    "type" : "search_phase_execution_exception",
    "reason" : "all shards failed",
    "phase" : "query",
    "grouped" : true,
    "failed_shards" : [ {
      "shard" : 0,
      "index" : "magento2-2-2-b2b-ee_product_1_v2",
      "node" : "gH9K5vt5QOaWaREP4fwkzw",
      "reason" : {
        "type" : "script_exception",
        "reason" : "scripts of type [inline], operation [search] and lang [groovy] are disabled"
      }
    } ]
  },
  "status" : 500
}
```

A different response! This is definitely progress. But now I'm being told that "scripts of type [inline], operation [search] and lang [groovy] are disabled"? This would require further reseach...

### Enabling Script Execution

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: My testing was done against a local Elasticsearch instance running on my laptop where I didn't have to worry about potentially malicious payloads. Don't do this in production!!!</p>
</div>

After trial and error with several settings I found that updating my elasticsearch.yml file with the following setting allowed me to get past the error...

```
script.inline: true
```

After making that change I sent the same request...

**Request**

```
curl "localhost:9200/magento2-2-2-b2b-ee_product_1_v2/_search?pretty" -d'
{
    "script_fields": {
        "test1": {
            "lang": "groovy",
            "script": "while (true) {print \u0027Hello World\u0027}"
        }
    }
}'
```

This time the query just hung. Success :metal:

### Specifying A Timeout

Per [the Request Body Search documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html) a `timeout` parameter can be supplied using one of the available [time units](https://www.elastic.co/guide/en/elasticsearch/reference/current/common-options.html#time-units). I decided to try out a 5 second timeout. I sent a query as follows...

**Request**

```
curl "localhost:9200/magento2-2-2-b2b-ee_product_1_v2/_search?pretty" -d'
{
    "timeout": "5s",
    "script_fields": {
        "test1": {
            "lang": "groovy",
            "script": "while (true) {print \u0027Hello World\u0027}"
        }
    }
}'
```

The result...the request just continued to hang, well beyond the 5 second timeout. This was strange, to say the least. I had specified that the request should timeout if it took more than 5 seconds. Why wasn't Elasticsearch cooperating?

### Reading The Fine Print

If I'd have read the "Six Ways to Crash Elasticsearch" article more closely I would have seen the following...

> Since Elasticsearch does not have a timeout for long running scripts the following script will never halt

A-ha! So even if you supply a timeout, Elasticsearch won't respect it for scripts. That would explain why the request never timed out.

While this query may be useful in some scenarios it doesn't exactly simulate an Elasticsearch timeout the way I was hoping to.

### Back To The Drawing Board

Turning back to Google, the next interesting tidbit I found was the ["Is there a way to simulate slow queries in Elasticsearch?"](https://discuss.elastic.co/t/is-there-a-way-to-simulate-slow-queries-in-elasticsearch/51381) topic on the Elasticsearch forums. There was only one response to the question, which was provided by an Elastic Team member. The response was as follows...

> To my knowledge there is no such query, but you could probably use a script query that either sleeps somewhere or performs some costly calculation. Haven't tried this myself though, but that might be an option.
 
This wasn't much help, but was starting to lead me in the direction of believing **there was no easy way to reliably simulate a timeout in Elasticsearch**, which is where I netted out in the end.

### More Fine Print - Timeouts

My research on the issue lead me to read in a bit more detail about how Elasticsearch handles the `timeout` parameter. This lead me to the following interesting piece of information on [the documentation for the timeout search option](https://www.elastic.co/guide/en/elasticsearch/guide/current/_search_options.html#_timeout_2)...

> It’s important to know that the timeout is still a best-effort operation; it’s possible for the query to surpass the allotted timeout.
 
This piece of information along with the test case using the script field made me start to think that maybe Elasticsearch's `timeout` parameter wouldn't be the most reliable way to solve the particular problem at hand.

### A Better Way To Solve The Problem

In the end, I came to the realization that I'd be better off using [curl's `--max-time` option](https://ec.haxx.se/usingcurl-timeouts.html#maximum-time-allowed-to-spend) than I would be using the Elasticsearch `timeout` parameter. As such, that's the path I wound up going with the implementation.