---
layout: blog-single
title: Sending a GET request with a request body with PHP cURL
date: April 16, 2020
image: 
tags: [PHP]
---

Some APIs require GET requests with request bodies. I was looking into how to do that today and struggling with Google. Eventually I found [this](https://stackoverflow.com/a/31579115) answer on StackOverflow.

PHP code is as follows:

```php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://maxchadwick.xyz');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
curl_setopt($ch, CURLOPT_POSTFIELDS, 'THIS IS THE REQUEST BODY');

curl_exec($ch);
```

<!-- excerpt_separator -->

Some of the other answers on the StackOverflow thread are incorrect...If you remove `CURLOPT_CUSTOMREQUEST` it will NOT default to a `GET` if you use `CURLOPT_POSTFIELDS` but will instead be a `POST`.

I used [Burp Suite](https://portswigger.net/burp) to intercept the request and confirm the above was doing a GET with a request body.

<img
  class="rounded shadow"
  src="/img/blog/php-curl-get-request-body/intercepting-request-in-burp-suite@1x.png"
  srcset="/img/blog/php-curl-get-request-body/intercepting-request-in-burp-suite@1x.png 1x, /img/blog/php-curl-get-request-body/intercepting-request-in-burp-suite@2x.png 2x"
  alt="Screenshot showing request intercepted in Burp Suite">

