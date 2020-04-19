---
layout: blog-single
title: Stripping A Query Parameter From A URL in PHP
description: The canonical answer for how to strip a query parameter from a URL in PHP
date: March 01, 2017
image: 
tags: [PHP]
ad: domain-clamp-ad-b.html
has_tweet: true
---

Recently I needed a function to remove a single query parameter from a given URL in PHP. This seems like the type of thing that there should be a canonical answer for, but, if you run [a Google search](https://www.google.com/search?q=stripping+query+parameter+from+url+in+php), you'll see that there are many ways to skin this cat.

After giving the task some thought, I wound up implementing essentially what is described in [this Stack Overflow answer](http://stackoverflow.com/questions/4937478/strip-off-url-parameter-with-php#answer-4937561). In this post, I share the approach, along with the final code.

<!-- excerpt_separator -->

### Breaking Up The URL

The first thing to do is to break the URL string into distinct pieces. PHP's [`parse_url`](http://php.net/parse_url) function will do this for you.

```php?start_inline=1
function http_strip_query_param($url)
{
    return parse_url($url);
}

$url = 'http://example.com/page?keep=1&delete=0';

var_dump(http_strip_query_param($url)) . PHP_EOL;
```

When we execute this...

```
$ php http_strip_query_param.php
array(4) {
  ["scheme"]=>
  string(4) "http"
  ["host"]=>
  string(11) "example.com"
  ["path"]=>
  string(5) "/page"
  ["query"]=>
  string(15) "keep=1&delete=0"
}
```

Now we're ready to process the URL.

### Replacing The Query Param

`parse_url` will return `query` as a string **not an array**. However, we can use [`parse_str`](http://php.net/manual/en/function.parse-str.php) to convert the query string to an array.

```php?start_inline=1
function http_strip_query_param($url)
{
    $pieces = parse_url($url);
    $query = [];
    if ($pieces['query']) {
        parse_str($pieces['query'], $query);
    }

    return $query;
}

$url = 'http://example.com/page?keep=1&delete=0';

var_dump(http_strip_query_param($url)) . PHP_EOL;
```

Here's how this will execute...

```
$ php http_strip_query_param.php
array(2) {
  ["keep"]=>
  string(1) "1"
  ["delete"]=>
  string(1) "0"
}
```

Note that rather than returning an array, `parse_str` stores the parsed query string in the variable that it receives as a second argument (or as global variables if a second argument is not supplied).

Once we have the query string as an array we can simply [`unset`](http://php.net/manual/en/function.unset.php) the query param we want to strip.

**Code**

```php?start_inline=1
function http_strip_query_param($url, $param)
{
    $pieces = parse_url($url);
    $query = [];
    if ($pieces['query']) {
        parse_str($pieces['query'], $query);
        unset($query[$param]);
    }

    return $query;
}

$url = 'http://example.com/page?keep=1&delete=0';
$param = 'delete';

var_dump(http_strip_query_param($url, $param)) . PHP_EOL;
```

**Result:**

```
$ php http_strip_query_param.php
array(1) {
  ["keep"]=>
  string(1) "1"
}
```

Then we need to convert `$query` back to a string  and replace `$parts['query']` with the our processed query string. We can use [`http_build_query`](http://php.net/manual/en/function.http-build-query.php) to convert the array back to a string.

**Code**

```php?start_inline=1
function http_strip_query_param($url, $param)
{
    $pieces = parse_url($url);
    $query = [];
    if ($pieces['query']) {
        parse_str($pieces['query'], $query);
        unset($query[$param]);
        $pieces['query'] = http_build_query($query);
    }

    return $pieces;
}

$url = 'http://example.com/page?keep=1&delete=0';
$param = 'delete';

var_dump(http_strip_query_param($url, $param)) . PHP_EOL;
```

**Result**

```
$ php http_strip_query_param.php
array(4) {
  ["scheme"]=>
  string(4) "http"
  ["host"]=>
  string(11) "example.com"
  ["path"]=>
  string(5) "/page"
  ["query"]=>
  string(6) "keep=1"
}
```

### Re-Assembling The URL

For some reason native PHP does not provide a built in function for re-assembling a URL that has been dis-assembled via `parse_url`. This seems odd to me considering it provides you with a means to dis-assemble a URL natively.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Why is `http_build_url` not built in to <a href="https://twitter.com/hashtag/php?src=hash">#php</a> . If I can parse natively with `parse_url` don&#39;t you think I&#39;d want to re-assemble?</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/837044864177041412">March 1, 2017</a></blockquote>

There are a few options...

1. Install [`pecl_http`](https://mdref.m6w6.name/http) and use the [`http_build_url`](http://php.net/manual/fa/function.http-build-url.php) function. This function will re-assemble the URL.
2. Polyfill `http_build_url`. The code to do so can be found [here](http://stackoverflow.com/questions/7751679/php-http-build-url-and-pecl-install#answer-7753154)

Once `http_build_url` is available (either view the extension or a polyfill) you simply use it to reassemble the pieces.

**Code**

```php?start_inline=1
function http_strip_query_param($url, $param)
{
    $pieces = parse_url($url);
    $query = [];
    if ($pieces['query']) {
        parse_str($pieces['query'], $query);
        unset($query[$param]);
        $pieces['query'] = http_build_query($query);
    }

    return http_build_url($pieces);
}

$url = 'http://example.com/page?keep=1&delete=0';
$param = 'delete';

var_dump(http_strip_query_param($url, $param)) . PHP_EOL;
```

**Result**

```
$ php http_strip_query_param.php
string(30) "http://example.com/page?keep=1"
```

### Clean Up

One of the most common issues I see during code review is indentation that can be prevented by using guard clauses properly. Let's do a little clean up.

```php?start_inline=1
function http_strip_query_param($url, $param)
{
    $pieces = parse_url($url);
    if (!$pieces['query']) {
        return $url;
    }

    $query = [];
    parse_str($pieces['query'], $query);
    if (!isset($query[$param])) {
        return $url;
    }

    unset($query[$param]);
    $pieces['query'] = http_build_query($query);

    return http_build_url($pieces);
}

$url = 'http://example.com/page?keep=1&delete=0';
$param = 'delete';

var_dump(http_strip_query_param($url, $param)) . PHP_EOL;
```

**Result**

```
$ php http_strip_query_param.php
string(30) "http://example.com/page?keep=1"
```

### Conclusion

I hope this post came in useful for some people. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
