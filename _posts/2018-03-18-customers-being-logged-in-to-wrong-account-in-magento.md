---
layout: blog-single
title:  "Customers Seeing Wrong Order Confirmation Page / Customer Account In Magento"
description: A new client reported that customers are sometimes logged in to the wrong account on their website. Here I document the saga and solution.
date: March 18, 2018
image: /img/blog/magento-wrong-customer-account/side-by-side@2x.jpg
tags: [Magento]
---

Recently, I was looped in to the following issue reported by a client we recently onboarded at [Something Digital](https://www.somethingdigital.com/)...

> Customers are placing orders and seeing the wrong order confirmation page. Also, customers are logging in and seeing the wrong customer account. 

:scream: Yes. It's as scary as it sounds.

This was a tricky one, but in the end I got to the bottom of it. Here, I'll document the saga and solution.

<!-- excerpt_separator -->

### The Cases

The client reported two cases of this happening. The first was a customer who reported seeing the order confirmation page from another customer. The second was a customer who logged in and saw the account of another user.

For the order confirmation case, I had the order number of the customer who reported the issue as well as the other customer's order number who they saw. I decided to take a closer look at that case to start.

I found the orders in question in the Sales > Orders grid of the Magento admin panel and the first thing that jumped out at was the timestamps.

<img
  class="rounded shadow"
  src="/img/blog/magento-wrong-customer-account/admin-order-grid@1x.jpg"
  srcset="/img/blog/magento-wrong-customer-account/admin-order-grid@1x.jpg 1x, /img/blog/magento-wrong-customer-account/admin-order-grid@2x.jpg 2x"
  alt="Admin order grid view">

**They were created within one second of each other**

This suggested that that proximity between two requests was a factor. Knowing this I set out to try to reproduce the issue.

### Reproduction

In order to attempt to reproduce the issue I came up with the following plan...pull up the login form in two separate browsers side by side, fill in credentials for different accounts in each, and press the login button in both as close as humanly possible to each other.

<img
  class="rounded shadow"
  src="/img/blog/magento-wrong-customer-account/side-by-side@1x.jpg"
  srcset="/img/blog/magento-wrong-customer-account/side-by-side@1x.jpg 1x, /img/blog/magento-wrong-customer-account/side-by-side@2x.jpg 2x"
  alt="Side by side logins">

The issue was reported in production, so I first wanted to see if I could reproduce it there.

So I created two accounts, followed those steps and voila, **I was logged in to the same account in both browsers, despite submitting the username and password of two unique users.**

### Analysis

Now that I was able to reproduce the issue I set out to do some analysis. The first place I looked was at the network panel in the browser developer tools. After a few minutes I had my first significant finding...

When a user submits a login request in Magento, two HTTP requests are made...

1. A POST request to /customer/account/loginPost. The credentials are validated here. If successful the server then responds with a 302 redirect which leads to...
2. A GET request to /customer/account

The interesting thing I found was that in the two browsers the response headers for the POST requests to /customer/account/loginPost would each respond with a unique value for the "frontend" Set-Cookie header as expected (the frontend cookie is the session identifier used by Magento 1). 

However, the responses in the subsequent GET requests to /customer/account **also** included a frontend Set-Cookie header overriding the initial cookie setting. **These responses set the same frontend cookie value in each browser.**

### Adding Logging

My next order of business was to add logging to understand what was causing the confusion on the Set-Cookie header in the GET response.

I first switched over to a staging environment to see if I could replicate it there. Fortunately I was able to, so I dropped the following logging in `Mage_Core_Model_Cookie::set()`

```diff
diff --git a/app/code/core/Mage/Core/Model/Cookie.php b/app/code/core/Mage/Core/Model/Cookie.php
index ffda4da29..edabd6120 100644
--- a/app/code/core/Mage/Core/Model/Cookie.php
+++ b/app/code/core/Mage/Core/Model/Cookie.php
@@ -235,6 +235,13 @@ class Mage_Core_Model_Cookie
             $httponly = $this->getHttponly();
         }

+        $message = array();
+        $message['pid'] = getmypid();
+        $message['name'] = $name;
+        $message['value'] = $value;
+        $message['backtrace'] = Varien_Debug::backtrace(true, false);
+        Mage::log(json_encode($message), null, 'set_cookie.log', true);
+
         setcookie($name, $value, $expire, $path, $domain, $secure, $httponly);

         return $this;
```

Then, I ran through the same test case again to generate the logs.

### Analyzing The Logs

After a bit of time reviewing the logs I noticed something interesting. The frontend cookie setting on the GET requests to /customer/account was only logged once, despite the fact that I was sending out two requests. This meant one of two things...

1. A call to PHP's `setcookie()` function was happening elsewhere than `Mage_Core_Model_Cookie::set()` OR
2. The PHP code wasn't actually being executed...e.g. the response came from a cache returned prior to PHP execution.

The first seemed unlikely, so I decided to pursue the second option.

### Creating A Simple Test

I next decided to create a simple test file to see if caching of Set-Cookie headers could be reproduced with Magento completely removed from the equation. I put the following in the webroot on staging...

```php
<?php

$rand = rand(0, 9999);
setcookie('rand', $rand);
```

Next I tried repeatedly CURL-ing it to see if I could reproduce the caching...

```
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=782
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=782
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=782
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=2705
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=2705
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=2705
$ curl https://www.example.com/test.php -D - --silent | grep rand
set-cookie: rand=2705
```

I was in luck! We could now take Magento out of the equation entirely and say for sure **it was some layer of caching that sat in front of Magento**.

### Some Information About The Hosting Environment

I was just about ready to send through this test case to the hosting company and ask them to figure it out. For whatever reason, the environment was configured to use both NGINX **and** Apache with NGINX sitting in the front. Additionally, cPanel + WHM were installed. I presented my findings to my team and one of my colleagues felt like it was likely that NGINX, which was operating as a reverse proxy was doing some caching. He did some digging through the NGINX configuration and found the following...

```nginx
# Initialize important variables
set $CACHE_BYPASS_FOR_DYNAMIC 0;
set $CACHE_BYPASS_FOR_STATIC 0;

# Generic query string to request a page bypassing Nginx's caching entirely for both dynamic & static content
if ($query_string ~* "nocache") {
    set $CACHE_BYPASS_FOR_DYNAMIC 1;
    set $CACHE_BYPASS_FOR_STATIC 1;
}   
```

He reran the same test with ?nocache at the end of the URL and lo and behold, the issue no longer reproduced with the simple test...

```
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=4701
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=4182
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=4465
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=938
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=903
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=4630
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=4924
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=7661
$ curl https://www.example.com/test.php\?nocache -D - --silent | grep rand
Set-Cookie: rand=3289
```

### The Fix

The fix we landed on was to simply to set the `$CACHE_BYPASS_FOR_DYNAMIC` and `$CACHE_BYPASS_FOR_STATIC` variables to 1 for all requests.

```nginx
set $CACHE_BYPASS_FOR_DYNAMIC 1;
set $CACHE_BYPASS_FOR_STATIC 1;
```

Magento already does extensive caching (this site was using Redis with Enterprise_PageCache) and this NGINX caching was offering little to no performance improvement, but causing massive problems.

Also, through some quick Googling I found that others have been burned with the same issue by these exact settings. This can be seen in [the "Engintron's micro caching" issue](https://github.com/engintron/engintron/issues/340) in [the engintron respository](https://github.com/engintron/engintron/issues/340) where [pedrosodre](https://github.com/pedrosodre) reported the following...

> this is a suggest based on a issue. I think Engintron's micro caching should be disabled by default, because it cause some problems to session, some users got their sessions copied for others users when Engintron's micro caching is enabled.
> 
> [engintron/engintron GitHub Issue #340 - "Engintron's micro caching"](https://github.com/engintron/engintron/issues/340#issue-195332481)
 
 As such I 100% agree with pedrosodre on this matter.
 
Caching policies must crafted to suit the behavior of the application being hosted. With defaults, there is risk of extremely severe issues such as what essentially boils down to (inadvertent) session hijacking as experienced here.

### NGINX Microcaching In General

While `$CACHE_BYPASS_FOR_DYNAMIC` and `$CACHE_BYPASS_FOR_STATIC` are variables used by [engintron](https://github.com/engintron/engintron), a tool that appears to be common only in cPanel/WHM environments, the concept of Microcaching is not unique to Engintron. For example, NGINX has a post on their blog titled ["The Benefits of Microcaching"](https://www.nginx.com/blog/benefits-of-microcaching-nginx/) which heavily advocates it's usage. This suggests that many system administrators or hosting providers may enable it by default.

In fact there's even a sample gist under the title ["Nginx Microcaching Magento"](https://codegists.com/code/nginx-microcaching-magento/) on the website [codegists.com](http://codegists.com/) which is susceptible to the same issue...

```nginx
# Setup var defaults
set $no_cache "";

# If non GET/HEAD, don't cache & mark user as uncacheable for 1 second via cookie
if ($request_method !~ ^(GET|HEAD)$) {
    set $no_cache "1";
}

# Drop no cache cookie if need be
# (for some reason, add_header fails if included in prior if-block)
if ($no_cache = "1") {
    add_header Set-Cookie "_mcnc=1; Max-Age=2; Path=/";            
    add_header X-Microcachable "0";
}

# Bypass cache if no-cache cookie is set
if ($http_cookie ~* "_mcnc") {
    set $no_cache "1";
}

# Bypass cache if flag is set
proxy_no_cache $no_cache;
proxy_cache_bypass $no_cache;

# Point nginx to the real app/web server
proxy_pass http://appserver.domain.com;

# Set cache zone
proxy_cache microcache;

# Set cache key to include identifying components
proxy_cache_key $scheme$host$request_method$request_uri;

# Only cache valid HTTP 200 responses for 1 second
proxy_cache_valid 200 1s;
```

All in all, NGINX microcaching is extremely dangerous in a Magento environment. I not recommend using it at all as we did here.

### What About Magento 2?

Based on my testing, it seems possible that similar scenarios can happen in Magento 2. While the GET response to /customer/account **doesn't** include a Set-Cookie response header there is a Set-Cookie response header in the initial page load on a Magento 2 site, which is a GET. It is possible that micro-caching could lead to some issues there as well as two users could be issued the same cookie.