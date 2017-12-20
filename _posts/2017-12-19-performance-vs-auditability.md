---
layout: blog-single
title:  Performance vs. Auditability
description: Have anyone ever told you they turn off logging for performance reasons? This posts explores the tradeoffs of performance and auditability.
date: December 19, 2017
image: 
tags: [Thoughts]
---

Have you ever heard anyone say this?

> We turn off logging in production for performance reasons.

Maybe, it's even something you've said yourself?

Over the years, I've heard people say many things that effectively throw auditability out the window in the name of performance. Here are just a few...

- "We turn off Apache access logs in production for improved performance"
- "We found that enabling New Relic lead to increased average response time application wide, so we decided not to use it"
- "I know you're trying to solve a deadlock issue, but you should be careful using MySQL's `innodb_print_all_deadlocks` setting for performance reasons"

Don't get me wrong...I'm for all prioritizing performance as a first class feature in your application. (On this blog I've written extensively about [scalability]({{ site.baseurl }}/tags/#scaling) and [performance]({{ site.baseurl }}/tags/#performance).)

But here's the thing, while I generally support decisions made in the name of performance, I also know from first hand experience that it's imperative that your application leave a thorough audit trail in order to solve strange and unexpected production issues.

To demonstrate this, let's examine the implications of the a couple of the statements listed above...

<!-- excerpt_separator -->

### We turn off Apache access logs in production for improved performance

Web server access logs are one of the first places a competent engineer will look when a site goes down or becomes unresponsive. These logs are extremely informative and can answer all of the following questions (and more)...

- Is a high volume of traffic originating from a specific IP address?
- Is a high volume of traffic originating from a specific unusual user agent string?
- Are there other anomalies in traffic patterns such as a high volume of traffic to a specific URL?

Without access logs none of these questions can be answered. 

Additionally, in the case of security breaches, forensic investigation is typically severely impaired if access logs are unavailable which could prevent an investigator from being able to identify an attacker's entry point.

### We found that enabling New Relic lead to increased average response time application wide, so we decided not to use it”

New Relic is a best in class application performance monitoring tool. In order to measure the performance of your application its agent injects itself into your code execution (known as ["instrumentation"](https://en.wikipedia.org/wiki/Instrumentation_(computer_programming))) capturing measurements to report back to the platform. 

While it is true that this adds some overhead to your code execution, the cost is negligible compared to the benefits implementing such a tool provides. 

Specifically, [New Relic targets a maximum of 5% overhead for its agents](https://www.quora.com/Does-adding-New-Relic-APM-to-a-Heroku-app-slow-it-down). However it will save you **much** bigger than that if a developer accidentally pushes out some code that makes your site slower when it catches the slowness and alerts you about it.

### The Bottom Line

The bottom line is that all too often decisions are made which have a minimal positive impact on performance, but severely negatively impact auditability. Please think twice when someone suggests disabling logs for performance reasons (and consider alternative solutions such as additional hardware).