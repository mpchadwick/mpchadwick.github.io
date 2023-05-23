---
layout: blog-single
title: Parsing Set-Cookie Headers In PHP with Guzzle
description: Guzzle's SetCookie class is the cleanest solution for parsing Set-Cookie headers in PHP. This post shows how to use it.
date: July 19, 2017
image: /img/blog/parse-set-cookie-headers-with-guzzle/parse-set-cookie-headers-with-guzzle.jpg
tags: [PHP]
ad: domain-clamp-ad-b.html
---

I recently had the need to extract the value of a Set-Cookie response header in PHP. Google lead me [`http_parse_cookie`](https://github.com/m6w6/ext-http/commit/9f564f1bb81519679a4cb362b868e9b1f93cd8a8). Unfortunately, `http_parse_cookie` requires `pecl_http` which isn't available with PHP out of box, and is a pain to install. 

Other Google results suggest [defining your own function](https://gist.github.com/pokeb/10590).

After a bit of research, I found  the [`SetCookie` class](https://github.com/guzzle/guzzle/blob/dfd01d60a38cf7e16b3456d4b1d7c10033b929c0/src/Cookie/SetCookie.php) in [Guzzle](https://github.com/guzzle/guzzle). The implementation is really clean and is the best option for parsing Set-Cookie headers in PHP in my opinion.

Here's a quick overview of how to use it...

<!-- excerpt_separator -->

### How To Use It

Usage in pretty simple. The easiest way to use Guzzle is via [composer](https://getcomposer.org/). Once you've [autoloaded](https://getcomposer.org/doc/01-basic-usage.md#autoloading) the library, you pass the `Set-Cookie` header as an argument to `GuzzleHttp\Cookie\SetCookie`'s `fromString` method as follows...

```php?start_inline=1
use GuzzleHttp\Cookie\SetCookie as CookieParser;

$cookieParser = new CookieParser;
$cookie = $cookierParser->fromString('Set-Cookie: key=value');
``` 

Now you can conveniently interact with the `$cookie`...

```php?start_inline=1
echo $cookie->getName(); // key
echo $cookie->getValue(); // value
```

You can also access many other aspects of the cookie

```php?start_inline=1
echo $cookie->getExpires();
echo $cookie->getHttpOnly();
echo $cookie->getSecure();
```

Check the [`Set-Cookie` class](https://github.com/guzzle/guzzle/blob/dfd01d60a38cf7e16b3456d4b1d7c10033b929c0/src/Cookie/SetCookie.php) for a full list of available methods...

### Conclusion

I hope this post came in useful for some people. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.