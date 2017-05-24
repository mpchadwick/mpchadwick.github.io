---
layout: blog-single
title: Send A Kapacitor Alert If No Data Is Received
description:
date: May 23, 2017
image: 
tags: [monitoring, kapacitor, influxdb]
ad: domain-clamp-ad-b.html
---

Recently, I ran into an issue where a misconfiguration lead to data not being pushed to InfluxDb for an extended period of time. It sucked and I wish I would've found out about it earlier. Here, I'll cover how you can use Kapacitor to receive an alert if InfluxDb has not received data for an extended period of time.

<!-- excerpt_separator -->

### The `deadman` method

In order to receive an alert when InfluxDb is not receiving data, you should be using the [`deadman`](https://docs.influxdata.com/kapacitor/v1.3/nodes/stream_node/#deadman)  method. Here's a description from the Kapacitor documentation

> Helper function for creating an alert on low throughput, a.k.a. deadman's switch. 

Typically, you would call `deadman` on a [`StreamNode`](https://docs.influxdata.com/kapacitor/v1.3/nodes/stream_node/).

The TICKScript to get an alert if there was no data for the `redis` measurement for more than 5 minutes would look like this.

```javascript 
var data = stream
    |from()
        .database('telegraf')
        .retentionPolicy('autogen')
        .measurement('redis')

data
    |deadman(0.0, 5m)
        .stateChangesOnly()
        .log('/tmp/alerts.log')
```

`deadman` takes two arguments, "threshold" and "interval". They are documented as follows...

> - Threshold -- trigger alert if throughput drops below threshold in points/interval. 
> - Interval -- how often to check the throughput. 

In the above we pass it 0.0 for threshold. This translates to alert me if NO data has been received. Then, we pass it 5m as the interval, meaning alert me if NO data has been received for 5 minutes.

### Chronograf

Chronograf provides a really nice UI for creating deadman alerts. Simply select the "Deadman" alert type and use the dropdown to configure the threshold at which you want to send an alert if no data has been received.

<img
  class="rounded shadow"
  src="/img/blog/kapacitor-alert-if-no-data/configuring-a-deadman-alert-in-chronograf@1x.jpg"
  srcset="/img/blog/kapacitor-alert-if-no-data/configuring-a-deadman-alert-in-chronograf@1x.jpg 1x, /img/blog/kapacitor-alert-if-no-data/configuring-a-deadman-alert-in-chronograf@2x.jpg 2x"
  alt="A screenshot showing how deadman alerts are configured in Chronograf">

### Conclusion

I hope that some of you found this post helpful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
