---
layout: blog-single
title: HTTP Request Header Size Limits
description: An exploration of the considerations of size limits for HTTP request headers
date: November 26, 2016
image:
tags: [sysadmin, security, debugging]
ad: domain-clamp-ad-b.html
---

Recently, I caught wind of an issue which was reported by the client as follows...

> Customers are getting error screens stating that their request was blocked.

At first glance, it smelled like an issue at the [WAF (web application firewall)](https://en.wikipedia.org/wiki/Web_application_firewall).

A quick call with our hosting provider later, we confirmed that requests were, indeed, violating the WAF's "max header size" policy. Let's take a look at the what and the why.

<!-- excerpt_separator -->

### What's Going On?

Digging in, we identified that some code was recently deployed that was maintaining a list of coupons "clipped" for a given user in a cookie. The cookie was later used as a cache key identifier for an area of dynamic content. Turns out this list could get pretty massive...some users had hundreds of coupons "clipped" to their profiles. The sheer size of this cookie, which was presented to the server in the headers of each request, was leading to legitimate customers being blocked by the WAF.

### Why Does The WAF Care About Request Header Size?

From what I learned, there is [a critical buffer overflow remote code execution vulnerability in IIS version 7.5](https://blogs.technet.microsoft.com/srd/2010/09/14/ms10-065-exploitability-of-the-iis-fastcgi-request-header-vulnerability/). As such, "max header size" is [a common feature](http://help.fortinet.com/fweb/537/Content/FortiWeb/fortiweb-admin/http_protocol_restraints.htm) [for many WAFs](https://campus.barracuda.com/product/webapplicationfirewall/article/WAF/ConfigReqLimits/). In our case, the WAF was configured to block requests with more than 4kb of headers.

### Digging In More - What I Learned

As I dug into the issue further, I learned that max header size is not only a concern from a security standpoint. In fact, most web servers impose their own set of size limits on HTTP request headers. There are a few threads about this on stack overflow. [This one](http://stackoverflow.com/questions/686217/maximum-on-http-header-values) lists out the size limits for some of the most popular web servers

- Apache: 8K
- nginx: 4K - 8K
- IIS: (varies by version): 8K - 16K
- Tomcat (varies by version): 8K - 48K

I wrote a little script to test this out for myself...

```php
#!/usr/bin/env php
<?php

$url = $argv[1];
$bytes = $argv[2];
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Junk: ' . bin2hex(openssl_random_pseudo_bytes($bytes / 2)),
]);
$response = curl_exec($ch);
$info = curl_getinfo($ch);
echo 'Response Code: ' . $info['http_code'] . PHP_EOL;
curl_close($ch);
```

It takes two parameters, the first it the URL to send the request to. The second is the number of bytes to send in a header.

Here are a few examples playing around with it...

```
➜  ~ ./sendRequest.php http://www.amazon.com 4000
Response Code: 200
➜  ~ ./sendRequest.php http://www.amazon.com 8000
Response Code: 400
➜  ~ ./sendRequest.php http://www.google.com 4000
Response Code: 200
➜  ~ ./sendRequest.php http://www.google.com 8000
Response Code: 200
➜  ~ ./sendRequest.php http://www.google.com 16000
Response Code: 413
```

As you can see, servers generally respond with either a [400](https://httpstatuses.com/400) or [413](https://httpstatuses.com/413) when the request headers are too big.

### What We Did

We attacked the issue from several angles. First and foremost, we ran the value of this cookie through [`gzencode`](http://php.net/manual/en/function.gzencode.php) before saving (and later [`gzdecode`](http://php.net/manual/en/function.gzdecode.php) when reading) to drastically decrease its size. Additionally, we were able to identify and eliminate a 3rd party service that was no longer in use that was further contributing to bloat of the request headers due to cookies.

### Monitoring Request Header Size

We didn't put this in place, but I also became interested in learning what options are available for monitoring the size of the headers in the HTTP requests coming to your application. With Apache, it looks like the best option is the `%I` directive which comes with [`mod_logio`](https://httpd.apache.org/docs/2.4/mod/mod_logio.html). Putting this directive in a [`LogFormat`](http://httpd.apache.org/docs/current/mod/mod_log_config.html#logformat) declaration, you can log the size of the request header AND body for each request. Then, you can use a log processing solution such as [the ELK stack](https://www.elastic.co/guide/index.html) to monitor this data over time. 

While this isn't a perfect solution, it at least gives some visibility into what's going in.

### The Rub

The bottom line is, be careful about limitations imposed by intermediaries, or even your web server when it comes to HTTP headers. 

I hope that this article helped a few people avoid or diagnose issues the HTTP request header limit. If you have any comments, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
