---
layout: blog-single
title: Magento's "Use HTTP Only" Cookie Setting
description: An investigation into Magento's "Use HTTP Only" cookie setting.
date: March 08, 2017
image: 
tags: [magento, security]
ad: domain-clamp-ad-b.html
---

Recently, while checking out [Mozilla Observatory](https://observatory.mozilla.org) I learned about the `HttpOnly` `Set-Cookie` directive. If you're not familiar with it, here's an explanation from MDN...

> HTTP-only cookies aren't accessible via JavaScript through the Document.cookie property, the XMLHttpRequest and Request APIs to prevent attacks against cross-site scripting (XSS).
> 
> [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Directives)

The "HttpOnly" name is a bit confusing and [is sometimes misinterpreted as having something do to with HTTP vs HTTPS](http://stackoverflow.com/questions/8611871/is-httponly-necessary-when-ssl-is-already-set). However, that is not the case. The idea is that the cookie is made available to the server as part of the HTTP request ("HTTP only"). However, the browser has no access to it. 

This provides a layer of security against XSS as, even if an attacker is able to get malicious script to execute on a web page, the attacker won't be able to access precious cookies, which are often the only key needed to compromise a user (or admin) account.

This got me interested in investigating how Magento manages that flag. I decided to dig in to get a better understanding. Here, I'll documented my findings...

<!-- excerpt_separator -->

### How PHP Manages This Directive

Before looking at how Magento manages this directive, it's worthwhile to look at how it is managed by PHP.

[PHP's `setcookie` function](http://php.net/manual/en/function.setcookie.php) allows the user to manage the `HttpOnly` flag through the `httponly` parameter, the 7th and final parameter.

```php?start_inline=1
setcookie($name, $value, $expire, $path, $domain, $secure, $httponly)
```

If set to `true`, the `Set-Cookie` response header will include the `HttpOnly` directive. 

By default, PHP sets `$httponly` to false.

### How Magento Manages This Directive

In the Magento admin panel there is a setting in the "Cookies" group called "Use HTTP Only". If set to "Yes", all cookies set by the framework will include the `HttpOnly` directive.

In Magento 2 this setting is available under Stores > Configuration > General > Web > Default Cookie Settings...

<img
  class="rounded shadow"
  src="/img/blog/magentos-use-http-only-cookie-setting/magento-2-use-http-only-cookie@1x.jpg"
  srcset="/img/blog/magentos-use-http-only-cookie-setting/magento-2-use-http-only-cookie@1x.jpg 1x, /img/blog/magentos-use-http-only-cookie-setting/magento-2-use-http-only-cookie@2x.jpg 2x"
  alt="A screenshot showing the Use HTTP Only cookie setting in the Magento 2 admin panel">

In Magento 1 it's available under System > Configuration > General > Web > Session Cookie Management...

<img
  class="rounded shadow"
  src="/img/blog/magentos-use-http-only-cookie-setting/magento-1-use-http-only-cookie@1x.jpg"
  srcset="/img/blog/magentos-use-http-only-cookie-setting/magento-1-use-http-only-cookie@1x.jpg 1x, /img/blog/magentos-use-http-only-cookie-setting/magento-1-use-http-only-cookie@2x.jpg 2x"
  alt="A screenshot showing the Use HTTP Only cookie setting in the Magento 1 admin panel">

The default setting is "Yes" in both Magento 1 and Magento 2.

### Leave This Setting On!

Because `Http-Only` cookies are not accessible to the browser, they cannot be stolen by XSS. As such you should always leave this setting on! In Magento 2 the following comment was even added to this setting...

> Warning:  Do not set to "No". User security could be compromised.

I'm not sure why Magento doesn't just remove this setting entirely since they've so strongly discouraged changing it :grimacing:

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.