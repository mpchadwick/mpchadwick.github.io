---
layout: blog-single
title: An Alternate Use Case For Prometheus Monitoring
date: April 08, 2016
tags: [Monitoring]
---

I first heard about [Prometheus](http://prometheus.io/) on [an episode of The Changelog Podcast](https://changelog.com/168/). Before tuning in, I read the description and was intrigued.  **Monitoring** is an important part of my day job where my team is responsible for ensuring the technical end of operations runs smoothly for many large scale ecommerce businesses. I saw that the episode featured an engineer from SoundCloud (a service I use regularly for streaming music) and decided to give it a spin.

<!-- excerpt_separator -->

I wasn't exactly sure what to expect from the episode. From a monitoring standpoint, we use tools such as Pingdom, New Relic and Rackwatch (monitoring service by hosting provider Rackspace). As I listened to the episode, I quickly realized that Prometheus is something very different from those tools - something a lot more involved to set up, but extremely powerful, and customizable.

After finishing the episode, I took it upon myself to download and play with Prometheus, and study the documentation. After a few hours I realized...

- I have some ideas about how this tool could greatly benefit me
- The way that I was thinking about using it is very different from how its creators intended it to be used

Below, I've first provided a high level overview of how Prometheus was originally intended to be used, as I understand it (feel free to skip this if you already know, or read it and correct me if I'm misunderstanding), and then followed that up with my thoughts on an alternate way that the tool could be leveraged.

### How Did The Creators Intend For Prometheus To Be Used?

The creators or Prometheus intended for you to use one of their [client libraries](http://prometheus.io/docs/instrumenting/clientlibs/) to keep track of ("push") metrics every time certain events occur in the execution of your application (you can also track more than just occurences using [`Histograms` and `Summaries`](http://prometheus.io/docs/practices/histograms/)). Occurences of HTTP response codes or counters for different types of error scenarios are the types of examples contained in the documentation. 

[Here](https://github.com/siimon/prom-client), is a link to the a library for NodeJS. Essentially, you need some storage in your application that persists requests that you can push to every time a certain thing happens. In Node you can just instantiate `Histogram`, `Counter` and `Gauge` variables in `app.js` (or whatever you name your entry point file) and push to those (since the Node process inherently persists requests). If you work in PHP (like me), you'd need to use something like Redis, APC or Memcached as a data store (note: there is no official PHP client library published on the Prometheus site and [this](https://github.com/lazyshot/prometheus-php) is the only one I could find.)

Then, you spin up a Prometheus instance elsewhere (it's just a compiled Go binary that you download and execute). Prometheus then asks for all the "metrics" via an HTTP request and stores them in its time series DB (this is what Prometheus is really good at). Additionally, it is excels at [visualization](http://prometheus.io/docs/visualization/grafana/) and [alerting](http://prometheus.io/docs/alerting/alertmanager/) based on the data it gathers. All this is done in Prometheus mainly by simply by configuring a couple YAML files (although tuning your system from a data storage standpoint [does seem like it could take some tweaking to get right](http://prometheus.io/docs/operating/storage/)).

### Gears Spinning in My Head

The types of examples Prometheus gives for monitoring via `Counters`, `Gauges` and `Summarys` and no doubt essential. If you're system is serving a higher than usual percentage of `5XX` responses you need to know about it, and fast. That being said, for me, I already feel that we have *most* of this covered with the monitoring tools we already have in place (New Relic, Pingdom, etc..). 

That being said, as a developer who is responsible for the operations of ecommerce systems there is a whole other range of things that need to be monitored that aren't the type of thing that New Relic is really intended for...

- Are orders flowing to the shipment providers?
- When did the system last receive an inventory update?
- What percentage of products are out of stock?
- Is order information flowing to the tax recording system?
- When did the Magento cron last successfully finish a job?
- When was the last time products were reindexed?
- How many documents are in the SOLR index right now?

There are many, many more, but hopefully you get the point.

The following pattern is a regular occurence in my life...

1. Some process that is essential to the business operations fails at some point for some reason or another.
2. We do a quick fix it (kill a blocking process, manually run a job) to get it running again.
3. We resolve to "monitor" the process and add alerting (this usually means writing a script and running it on the cron).
4. We figure out the root cause of the problem.
5. Even once we figure out the problem, the monitoring and alerting stays in place, which is a good thing.

For large scale operations, the number of things that we monitor this way gets very large.

This approach works, but is it really the best? Every time something goes wrong we have to write a new script. We have to add the alerting logic to that script. We have to register a new cron job (`crontab` is really getting out of hand at this point). If we want to look at historical data we are probably reviewing log files (which may be *really* large if we forgot to set up `logrotate`).

Is there not a better way?

### Prometheus To The Rescue!

Here's what Prometheus is good at...

- Talking to your application server and getting answers to questions (OK, yup, it's going to need to do that).
- Storing that information in it's time series database (Hmm, wait, my cron script was writing to a log file, but I'm not exactly sure that I would call that a time series database)
- Providing powerful tools for visualization (OK, yeah, I don't have that)
- Easily configuring alerts in a YAML file (Icing on the cake)

Are you not sold yet?

### How Do We Implement?

Here's the idea...instead of persisting some data throughout the lifetime of the application, we simply generate the answers to the questions that need to be monitored on the fly. Prometheus asks, the system answers...

**Prometheus:**

Yo System, when did you last finish running a cron job?

**System:**

`SELECT finished_at FROM cron_schedule ORDER BY finished_at DESC LIMIT 1;`

**Prometheus:** 

OK, thanks, I've stored that in my awesome time-series db. Oh, and by the way, how many products are you tracking right now?

**System**: 

`SELECT COUNT(*) FROM cataloginventory_stock_item;`


**Prometheus:** 

Awesome. One last thing, can you tell me how many of them are in stock?

**System:**

`SELECT COUNT(*) FROM cataloginventory_stock_item WHERE qty > 0;`

**Prometheus:**

Thanks, System. You're the best.

Of course it wouldn't go *exactly* like that. Actually it would be much more efficient. Basically, we'd create an HTTP endpoint that had answers to all things that needed to be monitored. Then, Prometheus would be configured to hit that endpoint and store that information.

Of course we'd then also leverage both the [visualization tools](http://prometheus.io/docs/visualization/grafana/) as well as [alerting suite](http://prometheus.io/docs/alerting/alertmanager/).

This seems like a massive improvment over our cron script approach of yesteryear.

### Thoughts?

At the time of writing this, this is all theoretical and is not something that I've used in production. However, I'm very excited by at all and hoping, at some point, that we can start migrating our monitoring efforts from cron scripts to Prometheus.

I'd love to hear what the Prometheus creators have to say about this idea, which is fundamentally different than the prescribed use case found in the documentation from what I can tell. Best way to reach me is on twitter [@maxpchadwick](https://twitter.com/maxpchadwick).
