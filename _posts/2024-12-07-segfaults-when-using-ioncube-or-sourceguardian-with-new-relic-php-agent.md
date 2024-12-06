---
layout: blog-single
title:  "Segfaults when using ionCube or SourceGuardian wih the New Relic PHP Agent"
date: December 6, 2024
image: 
tags: [Adobe Commerce]
related_posts:
---

Over the past few months I've seen reports from multiple clients about problems saving and updating product information on their Adobe Commerce stores. We originally saw the issue back in August and I need to give credit to [Webscale](https://www.webscale.com/)'s support as they were actually the ones who identified the root cause.

<!-- excerpt_separator -->

There is a [known issue](https://github.com/newrelic/newrelic-php-agent/issues/873) when using versions > 10.17.0.7 of the New Relic PHP Agent with ionCube or SourceGuardian installed (which was the case on all the projects where we saw this issue). The problem is apparently connected to a [known issue](https://github.com/php/php-src/issues/13817) in PHP core with the observable API. 

When this has come up, downgrading the New Relic PHP agent to 10.17.0.7 as recommended [here](https://github.com/newrelic/newrelic-php-agent/issues/873#issuecomment-2088302068) has solved the problem, however it also [appears](https://github.com/php/php-src/issues/13817#issuecomment-2284464083) that there is a fix in PHP core and upgrading to a to PHP >= 8.2.23 / 8.3.11 may also be a viable option.
