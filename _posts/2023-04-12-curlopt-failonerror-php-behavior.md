---
layout: blog-single
title:  "What CURLOPT_FAILONERROR does in PHP"
date: April 12, 2023
image: 
tags: [PHP]
related_posts:
---

<div class="tout tout--secondary">
<p>Testing for this blog post was done with PHP version 8.2.1</p>
</div>


During a recent code review I learned about [`CURLOPT_FAILONERROR`](https://curl.se/libcurl/c/CURLOPT_FAILONERROR.html) for the first time.

I read through both the [libcurl documentation](https://curl.se/libcurl/c/CURLOPT_FAILONERROR.html) as well as [the PHP documentation](https://www.php.net/manual/en/function.curl-setopt.php) and in the end was still unclear exactly what this option does. 

In this post I'll share my findings from some experimentation.

<!-- excerpt_separator -->

### What the libcurl documentation says

The libcurl documentation describes the behavior as follows:

> Request failure on HTTP response >= 400
>
> A long parameter set to 1 tells the library to fail the request if the HTTP code returned is equal to or larger than 400. The default action would be to return the page normally, ignoring that code.
>
> When this option is used and an error is detected, it will cause the connection to get closed and CURLE_HTTP_RETURNED_ERROR is returned.

Source: [https://curl.se/libcurl/c/CURLOPT_FAILONERROR.html](https://curl.se/libcurl/c/CURLOPT_FAILONERROR.html)

### What the PHP documentation says

> `true` to fail verbosely if the HTTP code returned is greater than or equal to 400. The default behavior is to return the page normally, ignoring the code.

Source: [https://www.php.net/manual/en/function.curl-setopt.php](https://www.php.net/manual/en/function.curl-setopt.php)

### My Questions

Reading through these pieces of documentation I was left with a few questions

- What is the definition "fail the request" (from the libcurl documentation) or "fail" from the PHP documentation?
- What will `curl_exec` return if the request "fails"? The libcurl documentation seems to suggest the return value will be `CURLE_HTTP_RETURNED_ERROR`.

### First order of business: What is `CURLE_HTTP_RETURNED_ERROR`?

The first thing I was interested in was what the `CURLE_HTTP_RETURNED_ERROR` `const` evaluated to in PHP. Using `php -r` here's what I found:

```php
$ php -r 'var_dump(CURLE_HTTP_RETURNED_ERROR) . PHP_EOL;'
int(22)
$ php -r 'var_dump((bool)CURLE_HTTP_RETURNED_ERROR) . PHP_EOL;'
bool(true)
```

Given these findings it seemed unlikely to me that PHP would actually return `CURLE_HTTP_RETURNED_ERROR` if the request "failed" (would it _really_ return a truth-y value?), despite what the `libcurl` documentation had to say.

### Running some tests

First, I created a simple script that would return an HTTP 503 response code and a response body with the string "error".

```php
<?php

http_response_code(503);

echo 'Error' . PHP_EOL;
```

Next I used `php -S` to run a server on port 1234 that would execute that script. 

```
$ php -S localhost:1234
[Wed Apr 12 21:30:36 2023] PHP 8.2.1 Development Server (http://localhost:1234) started
```

Then, I created a script that would send a request to my server, to test the behavior of `CURLOPT_FAILONERROR`.

```php
<?php

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:1234');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FAILONERROR, true);

$response = curl_exec($ch);

var_dump($response) . PHP_EOL;
var_dump(curl_error($ch) . PHP_EOL);
```

Finally, I got the response.

```
$ php test.php
bool(false)
string(38) "The requested URL returned error: 503
"
```

### What I learned

Based on this test, here's what I learned about what `CURLOPT_FAILONERROR` does in PHP

- If the URL returns an HTTP status code >= 400, `curl_exec` will return `false`
    - `CURLOPT_RETURNTRANSFER` cannot be used to access the response body when this option is used
- `curl_error` will return a message indicating the HTTP status code that was received.

### My conclusion

Ultimately `CURLOPT_FAILONERROR` doesn't seem like a great option since it discards the response body, which might have useful information in the case of a failure. The `CURLINFO_HTTP_CODE` option of `curl_getinfo` seems like a better way the handle error unexpected HTTP response codes.
