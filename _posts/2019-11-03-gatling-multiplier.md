---
layout: blog-single
title:  "Gatling Multiplier Parameter"
date: November 3, 2019
image: 
tags: [Tools, Gatling]
---

Typically, when load testing a system with Gatling, I create a simulation script which consists of a number of scenarios which are executed simultaneously at different ratios. Execution of the scenarios would look something like this:

```scala
setUp(
    BouncerHome.inject(rampUsers(360) during (300 seconds)),
    BrowserCategory.inject(rampUsers(60) during (300 seconds)),
    Searcher.inject(rampUsers(40) during (300 seconds)),
    Uncached404.inject(rampUsers(40) during (300 seconds)),
    UncachedPdp.inject(rampUsers(60) during (300 seconds)),
    PurchaseIntent.inject(rampUsers(10) during (300 seconds))
).protocols(httpProtocol)
```

I then run the simulation a number of times, gradually increasing the load to identify the breaking point.

For example, after running at the ratios above I might double the load as follows:

```scala
setUp(
    BouncerHome.inject(rampUsers(720) during (300 seconds)),
    BrowserCategory.inject(rampUsers(120) during (300 seconds)),
    Searcher.inject(rampUsers(80) during (300 seconds)),
    Uncached404.inject(rampUsers(80) during (300 seconds)),
    UncachedPdp.inject(rampUsers(120) during (300 seconds)),
    PurchaseIntent.inject(rampUsers(20) during (300 seconds))
).protocols(httpProtocol)
```

Then triple (and so on and so forth).

<!-- excerpt_separator -->

Rather than manually increasing the number of users for each scenario for each test, a better way is to pass a "multiplier" as a [command line parameter](https://gatling.io/docs/3.3/cookbook/passing_parameters/) when invoking Gatling.

Our Gatling script would now look like this...

```scala
val multiplier = Integer.getInteger("multiplier", 1)

setUp(
    BouncerHome.inject(rampUsers(360 * multiplier) during (300 seconds)),
    BrowserCategory.inject(rampUsers(60 * multiplier) during (300 seconds)),
    Searcher.inject(rampUsers(40 * multiplier) during (300 seconds)),
    Uncached404.inject(rampUsers(40 * multiplier) during (300 seconds)),
    UncachedPdp.inject(rampUsers(60 * multiplier) during (300 seconds)),
    PurchaseIntent.inject(rampUsers(10 * multiplier) during (300 seconds))
).protocols(httpProtocol)
```

Now, in order to double the load, instead of increasing the user values for each scenario we'd pass a multiplier value of "2" when invoking Gatling as follows:

```
$ JAVA_OPTS="-Dmultiplier=2" bin/gatling.sh
```