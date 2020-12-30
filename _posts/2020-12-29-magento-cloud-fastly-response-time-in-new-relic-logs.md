---
layout: blog-single
title:  "Magento Cloud Response Times as measured by Fastly in New Relic"
date: December 29, 2020
image: /img/blog/magento-cloud-fastly-response-time/example-graph@2x.png
tags: [Magento]
---

Recently I've been dealing with a Magento performance issue that appears to been caused by Fastly (more on that in another post). Here I wanted to share a quick tip on how to view Fastly response times for Magento Cloud in New Relic.

<!-- excerpt_separator -->

Somewhat recently, [Magento has begun leveraging New Relic logs to aggregate log data](https://devdocs.magento.com/cloud/project/log-locations.html#manage-log-data) (an excellent addition to the platform!). The logs being aggregated include Fastly logs.

While your first instinct may be to click the "Logs" link in the top menu, I've generally found New Relic Insights [NRQL](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/nrql-syntax-clauses-functions) searches to be much more powerful for analyzing log data.

Here's an example NRQL query to view average response times for the home page for the past day:

```
SELECT average(numeric(time_elapsed)) / 1000000 FROM Log WHERE url = '/' SINCE 1 day ago TIMESERIES 5 minutes
```

Here's an example of the result

<img
  class="rounded shadow"
  src="/img/blog/magento-cloud-fastly-response-time/example-graph@1x.png"
  srcset="/img/blog/magento-cloud-fastly-response-time/example-graph@1x.png 1x, /img/blog/magento-cloud-fastly-response-time/example-graph@2x.png 2x"
  alt="Graph of query result">
  
A few notes:

- We convert to `numeric` as Magento ships the data to New Relic as a string
- We divide by 1 million as `time_elapsed` is in microseconds
- `TIMESERIES 5 minutes` adds more precision to the graph...New Relic will otherwise show in 30 minute buckets

While in my case this was helpful for troubleshooting the performance issue this can also be helpful for getting a better picture of your site speed vs. New Relic APM as this data is inclusive of cached responses (which would otherwise not be included when just viewing APM data).