---
layout: blog-single
title: HTTP Response Header Size Limits
description: A dive into the HTTP response header size limits, looking at the various places along the way that one can run into these types of limitations.
date: January 24, 2017
image: 
tags: [sysadmin, security, debugging, networking]
ad: domain-clamp-ad-b.html
---

A while back I published a post about [HTTP request header size limits]({{site.url}}/blog/http-request-header-size-limits). At the time, I had just finished remediating an issue where requests were being blocked by a WAF for exceeding the "max header size" policy.

Recently, I've been dealing with a similar, but slightly different issue...requests failing due to the size of the **response** headers. Here, I'll document my findings on this issue...

<!-- excerpt_separator -->

### Who Imposes These Limits

#### CDNs

The party complaining about large HTTP response headers for the issue I was working was Akamai, a popular edge caching solution. Per [this forum post](https://community.akamai.com/thread/4641-ending-up-with-bad-request-when-posted-with-long-urls-header-vs-uri-limit-extension), if the origin serves a response with more than 8192 bytes of headers, Akamai will serve a 502 to the client. The official documentation regarding this limitation is only available when logging in to their portal. This limitation is not handled particularly gracefully by Akamai and the result is a [WSoD](http://www.webopedia.com/TERM/W/white_screen_of_death.html) with no error message.

#### Servers

Some servers, notably Tomcat impose their own set of limits on response header size. Tomcat allows you to tweak the configuration of the `maxHttpHeaderSize` attribute, however it defaults to 8192 bytes...

> `maxHttpHeaderSize`: The maximum size of the request and response HTTP header, specified in bytes. If not specified, this attribute is set to 8192 (8 KB).
> 
> [https://tomcat.apache.org/tomcat-8.0-doc/config/http.html#Standard_Implementation](https://tomcat.apache.org/tomcat-8.0-doc/config/http.html#Standard_Implementation)

#### Hosting Companies

Heroku is an example of a hosting company which imposes restrictions HTTP response headers. Their docs state a limit of 8192 bytes for response cookies, for example, citing CDN restrictions...

> Cookies are explicitly restricted to 8192 bytes. This is to protect against common restrictions (for example, imposed by CDNs) that rarely accept larger cookie values. In such cases, a developer could accidentally set large cookies, which would be submitted back to the user, who would then see all of his or her requests denied.
> 
> [https://devcenter.heroku.com/articles/http-routing#http-validation-and-restrictions](https://devcenter.heroku.com/articles/http-routing#http-validation-and-restrictions)

#### Other Parts of the Stack

All sorts of other parts of the technology stack may also impose these types of limits.

Based on a quick scan of [a Google search for "http response header size limit 8192"](https://www.google.com/search?q=http+response+header+size+limit+8192) it seems the following all impose limitations on HTTP response header size (which are typically configurable).

- [Elasticsearch](https://github.com/elastic/elasticsearch/issues/5665)
- [Play framework](https://github.com/playframework/playframework/issues/5036)
- [HAProxy](http://blog.nkhost.net/linux/haproxy-headers-size-limit-is-8k/)

### When Would One Run Into These Limitations

One is likely to run into these limits when using cookies to track some attribute of a visitor that has no upper limit. For example, imagine an e-commerce application stored the contents of a visitors shopping cart in a cookie. This would be problematic, as, when a user's shopping cart exceeds some certain amount, the size `Set-Cookie` header containing the contents of the cart would exceed the HTTP response header size limit.

### What To Do

When contemplating using a cookie to store some piece of information it is important to consider whether that information has an upper bound. If it does not, cookies are a dangerous choice. A good alternative is to use [local storage](todo) to store the data on the user's browser so that it does not need to be transferred back and forth over HTTP.

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.