---
layout: blog-single
title:  "The Case of the Vanishing uRapidFlow License Key"
description: Tracking down an interesting issue where the uRapidFlow license key mysteriously vanished from the database.
date: June 14, 2018
image: /img/blog/vanishing-urapidflow-license/missing-license@2x.jpg
tags: [Magento, MySQL]
---

Recently, I received an email from a client that read something like this...

> Subject: URGENT: Feeds not running
> 
> Feeds did not run this morning. Pricing is wrong on the website.
> 
> HELP!!!!

The website was using a [uRapidFlow](todo) profile that was run on a cron to regularly import product pricing. Navigating to the profile in the Magento admin panel I got the following error...

<img
  class="rounded shadow"
  src="/img/blog/vanishing-urapidflow-license/error@1x.jpg"
  srcset="/img/blog/vanishing-urapidflow-license/error@1x.jpg 1x, /img/blog/vanishing-urapidflow-license/error@2x.jpg 2x"
  alt="A screenshot of the error experienced">

<p class="caption">Error message: Module record not found: Unirgy_RapidFlow</p>

Here, I'll document my findings...

<!-- excerpt_separator -->

### Tracking It Back To The License

The error message was vague and didn't give many clues about what the actual issue was. Rather than dig through the code to try to trace it back, I pasted the error message into my company's chat to see if anyone else had encountered it before. I quickly heard back that we had, in fact, seen this exact error on another project very recently. We had tracked it back to the license keys mysteriously vanishing at that time, and were in the midst of an investigation to get to the true root cause of the issue.

I navigated to the Manage Licenses screen for uRapidFlow installation and lo and behold the license was in fact missing...

<img
  class="rounded shadow"
  src="/img/blog/vanishing-urapidflow-license/missing-license@1x.jpg"
  srcset="/img/blog/vanishing-urapidflow-license/missing-license@1x.jpg 1x, /img/blog/vanishing-urapidflow-license/missing-license@2x.jpg 2x"
  alt="A screenshot of show the license missing">

### The Temporary Fix - Re-adding the License Key

I was able to track down the license key from our password manager and added it back through the Magento admin panel. I navigated back to the uRapidFlow profile in question and manually forced it to run. It ran with no error message this time. Success :raised_hands:

### Tracking Down The Root Cause

Of course we didn't want to leave things just like that. As mentioned, we were already investigating this on the other website where we had experienced the same thing, and now we had yet another case of the same behavior. The steps we took to investigate were as follows...

- Contact Unirgy (the company that built and maintains uRapidFlow)  to find out if they'd see this behavior on any other projects and knew of a fix
- Contact the hosting company (both sites were hosted on Magento Commerce Cloud) to receive their assessment
- Conduct our own review of the issue to understand why this may have happened.

Fortunately, Magento was able to come back with an explanation that made sense.

### So What Was The Issue?

The issue turned out to be due to the fact that the uRapidFlow license keys were stored in a [MyISAM](https://dev.mysql.com/doc/refman/5.7/en/myisam-storage-engine.html) table.

Magento Cloud uses a [Galera](http://galeracluster.com/) cluster with 3 nodes and, per [the Galera documentation](https://mariadb.com/kb/en/library/mariadb-galera-cluster-known-limitations/) MyISAM data does not replicate in Galera clusters. What happened here was that the "master" node was cycled, causing the MyISAM data to disappear<sup style="display: inline-block" id="a1">[1](#f1)</sup>.

We contacted Unirgy about this issue and who shortly thereafter published version 2.0.8 of Unirgy_SimpleLicense and Unirgy_SimpleUp with the table definitions changed.

Moving forward we'll be mindful of this should we see mysterious data disappearance related to any other custom or 3rd party code.

### Footnotes

<b id="f1">1 </b>. Magento Cloud doesn't really do multi-master with Galera, but rather does a single master with two cold replicas for failover. Whether or not this architecture is sane is a question for another time and place...[↩](#a1)