---
layout: blog-single
title:  New Relic Alert When No Data is Received
date: November 4, 2019
image: 
tags: [Tools, Monitoring]
---

There is a [known bug](https://discuss.newrelic.com/t/newrelic-daemon-not-loading/27696/21) with the New Relic PHP agent that causes it to stop reporting data when it is upgraded.

When I ran into this recently it made me think, "it would be nice if I could have New Relic send me an alert when it stops receiving data from the application."

<!-- excerpt_separator -->

Some Googling revealed that unfortunately, this is easier said than done.

The [best option](https://discuss.newrelic.com/t/how-to-get-alert-when-application-is-not-reporting-data/54437/4?u=stefan_garnham) appears to be a create an alert based on a NRQL query which checks the `count` of transactions from the application.

It seems like there should be an on / off switch for this somewhere in the APM settings and it should default to on...