---
layout: blog-single
title:  HTTP Response Header Size Limits With mod_proxy_fcgi
description: My findings investigating an issue with HTTP response header limits with mod_proxy_fcgi.
date: December 18, 2017
image: 
tags: [Networking, Debugging]
---

A while back I wrote [a general article about HTTP response header limits]({{ site.baseurl }}{% link _posts/2017-01-24-http-response-header-size-limits.md %}). The post was written in response to an issue I was dealing with where a CDN was serving a 502 when the origin served more than 8192 bytes of headers. 

Recently, I've been investigating yet another issue with HTTP response header size limits, this time specifically with [Apache's mod_proxy_fcgi module](https://httpd.apache.org/docs/2.4/mod/mod_proxy_fcgi.html). Here, I'll document my experience and findings...

<!-- excerpt_separator -->

### Steps To Reproduce

The issue is **very** easy to reproduce. Configure Apache to use mod_proxy_fcgi to pass requests to PHP-FPM....

```xml
<FilesMatch \.php$>
    SetHandler "proxy:fcgi://127.0.0.1:9000"
</FilesMatch>
```

Then execute a PHP script which will send more than 8192 bytes of response headers...

```php
<?php

$junk = bin2hex(openssl_random_pseudo_bytes(5000));

header('Junk: ' . $junk);
```

When you execute this PHP script you'll get a 500 response and the following in Apache's error log...

```
[Mon Dec 11 22:46:51.889337 2017] [proxy_fcgi:error] [pid 43182:tid 123145320845312] [client ::1:61912] Premature end of script headers: test.php
[Mon Dec 11 22:46:51.890430 2017] [proxy_fcgi:error] [pid 43182:tid 123145320845312] [client ::1:61912] AH01070: Error parsing script headers
[Mon Dec 11 22:46:51.890461 2017] [proxy_fcgi:error] [pid 43182:tid 123145320845312] (22)Invalid argument: [client ::1:61912] AH01075: Error dispatching request to :
```
{:.wrap}

### Researching The Issue

My investigation of this issue lead me to a GitHub issue titled, ["Backend modules don't work in version 2.0.0" in the TYPO3-metaseo GitHub project](https://github.com/webdevops/TYPO3-metaseo/issues/233).

After some back and forth with the maintainer, the issue reporter stated that increasing Apache's `HUGE_STRING_LEN` value and re-compiling Apache fixed the issue. 

While running a customized, manually compiled version of Apache isn't ideal from a maintainability standpoint (so long yum updates), I decided to test things out anyway.

### Recompiling Apache

So, I [downloaded a copy of the Apache source code](https://httpd.apache.org/download.cgi) myself (version 2.4.29), increased `HUGE_STRING_LEN` to 16384 in `httpd.h` and recompiled Apache. Unfortunately even after doing so I continued to experience the issue.

A few other values looked interesting to me...

- `DEFAULT_LIMIT_REQUEST_LINE`
- `DEFAULT_LIMIT_REQUEST_FIELDSIZE`
- `AP_IOBUFSIZE`

These all also defaulted to 8192. Unfortunately even with all those increased to 16384 the issue persisted.

### Current Status On The Issue

While I may continue spend some additional time trying to track down this issue, on the project in question, we needed a quicker solution. As such, there were two immediate options...

1. Continue using Apache and move away from mod_proxy_fcgi (and as a result PHP-FPM) in favor of mod_php
2. Continue using PHP-FPM and move away from Apache in favor of nginx.

After evaluating these options we opted for the latter approach. Since doing so we haven't run into this issue any longer.