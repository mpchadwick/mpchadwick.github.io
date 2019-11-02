---
layout: blog-single
title:  "Expected 404s and Gatling"
date: November 1, 2019
image: 
tags: [Tools, Gatling]
---

For many websites, for one reason or another (bots?), a not insignificant amount of traffic winds up hitting a 404 page. When load testing a website like this it is important that this traffic is represented for an accurate simulation.

<!-- excerpt_separator -->

With Gatling, by default a 404 response code is interpreted as a "KO". But in this case the 404 is expected and should not be represented as a failure in Gatling's reports.

We can tell Gatling the 404 status is expected by adding `.check(status.is(404))` to the request.

Here's a full example:

```scala
val scn = scenario("Scenario 1")
    .exec(http("request_1")
        .get("/404")
        .check(status.is(404)))
```