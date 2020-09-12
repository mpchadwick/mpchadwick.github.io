---
layout: blog-single
title:  "Gatling disableFollowRedirect without KO"
date: September 11, 2020
image: 
tags: [Tools, Gatling]
---

I'm currently working on a Gatling simulation which involves sending traffic to an endpoint that issues an HTTP 307 response. For this load test I want to send requests to this endpoint, but I don't want Gatling to follow the redirect. You can instruct Gatling to not follow the redirect by calling [`disableFollowRedirect`](https://gatling.io/docs/current/http/http_request/#followredirect):

```scala
http("My request")
    .get("/redirecting-url")
    .disableFollowRedirect
```

However, doing this will cause Gatling to flag the request as a KO, when the endpoint issues a 307 response.

<!-- excerpt_separator -->

This issue can be resolved by "whitelisting" the status code as expected via [`status.is`](https://gatling.io/docs/current/http/http_check/#validating).

```scala
http("My request")
    .get("/redirecting-url")
    .disableFollowRedirect
    .check(status.is(307))
```

Now Gatling will no longer report the request as KO.