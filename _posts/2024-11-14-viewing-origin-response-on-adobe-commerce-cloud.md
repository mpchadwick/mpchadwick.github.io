---
layout: blog-single
title:  "Viewing Origin Response on Adobe Commerce Cloud"
date: November 14, 2024
image: 
tags: [Adobe Commerce]
related_posts:
---

Recently I was working through an issue on an Adobe Commerce Cloud project where I was interested to see the raw response headers issued by the Magento backend. With Adobe Commerce Cloud, requests are typically routed through Fastly which removes and modifies the origin response headers. My searching and testing wasn't turning up a solution for my needs. Adobe provides [documentation on how to "bypass" Fastly](https://experienceleague.adobe.com/en/docs/commerce-cloud-service/user-guide/cdn/custom-vcl-snippets/fastly-vcl-bypass-to-origin). While this is useful in some cases, such as preventing specific pages from being cached, it still doesn't allow visibility into the raw response.

I opened a support ticket with Adobe and they provided the below answer. Since I couldn't find it documented anywhere publicly, I figured I'd share it here.

<!-- excerpt_separator -->

### The Solution

This is possible by SSH-ing to the backend server and issuing the following `curl` command directly to `localhost:8080` (replace `www.example.com` with the domain of the website you are trying to access).

```
$ curl -D - -o /dev/null -s http://localhost:8080/ -H "X-Forwarded-Proto: https" -H "Host: www.example.com"
````

I had tried something similar (using `curl --resolve`) prior to contacting Adobe, but hadn't been able to get it to work.

The example above would load the home page of example.com. The localhost URL path can also be changed to load a specific page. For example, in my case I was interested to see the response headers of the 404 page, which I achieved as follows.

```
$ curl -D - -o /dev/null -s http://localhost:8080/404 -H "X-Forwarded-Proto: https" -H "Host: www.example.com"
````
