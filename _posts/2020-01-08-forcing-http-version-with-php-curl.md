---
layout: blog-single
title: Forcing HTTP Version with PHP cURL
date: January 8, 2020
image: 
tags: [PHP]
---

A colleague recently reported a strange bug to me:

> I'm troubleshooting an issue where data fails to sync the a 3rd party and I've identified this error when curl_exec runs
> 
> HTTP2 framing layer error
>
> From what I gather online is that this typically a somewhat generic error and could have multiple causes.

<!-- excerpt_separator -->

My gut was that this was potentially an internal bug with the curl that was being used. As a temporary workaround I thought it would be interesting to see if it was possible to force the request to go over HTTP/1.1.

It took a bit of Googling but I was ultimately able to find [`CURLOPT_HTTP_VERSION`](https://curl.haxx.se/libcurl/c/CURLOPT_HTTP_VERSION.html) in the curl documentation.

In PHP, this can be set as follows:

```php
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
```

Adding this code worked as a temporary fix for the issue my colleague was experiencing.