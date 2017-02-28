---
layout: blog-single
title: URL Based Apache Directives
description: A look at how to configure Apache directives for certain URLs
date: February 27, 2017
image: 
tags: [apache]
ad: domain-clamp-ad-b.html
---

Recently, I was working through an issue where I wanted to conditionally increase PHP's memory limit based on the request URL. Rather than building that logic into the application, handling via Apache directives seemed like a cleaner approach. Here I'll outline how I achieved this.

<!-- excerpt_separator -->

### Introducing The `<Location>` and `<LocationMatch>` Directives

Typically, in order to change configuration directives for certain URLs you should declare them inside a `<Location>` or `<LocationMatch>` directive. `<Location>` and `<LocationMatch>` use slightly different mechanics for matching the request URL against the supplied string.

`<LocationMatch>` is easy to understand, it simply interprets the string provided as a PCRE regular expression. The below would match any URL containing the string "api" in the path.


```xml
<LocationMatch "api">
    php_value memory_limit 1G
</LocationMatch>
```

The rules for the `<Location>`  section are a bit more tricky. They can be found in the Apache documentation..

> The enclosed directives will be applied to the request if the path component of the URL meets any of the following criteria:
>
> - The specified location matches exactly the path component of the URL.
> - The specified location, which ends in a forward slash, is a prefix of the path component of the URL (treated as a context root).
> - The specified location, with the addition of a trailing slash, is a prefix of the path component of the URL (also treated as a context root).
> 
> [https://httpd.apache.org/docs/2.4/mod/core.html#Location](https://httpd.apache.org/docs/2.4/mod/core.html#Location)

There are a few examples in the link above.

### `<Files>`, `<FilesMatch>`, `<Directory>` and `<DirectoryMatch>`

Apache provides a few other methods for applying directives at a specific scope, the `<Files>`, `<FilesMatch>`, `<Directory>` and `<DirectoryMatch>` directives. 

The important thing to understand is that **these directives only apply to physical locations on disk**. Typically, dynamic applications route requests to a single entry point (e.g. index.php) which is then responsible for passing the request along to the appropriate controller. As a result, these directives are almost certainly not what you're looking for.

### Context

All Apache directives have an associated [context](https://httpd.apache.org/docs/2.4/mod/directive-dict.html#Context), which defines where these directives can legally be included. While `<Files>` and `<FilesMatch>` are allowed in `.htaccess` files, `<Location>` and `<LocationMatch>` are not. You must include these directives inside `<VirtualHost>` containers in your server configuration files. The good news is you can simply gracefully reload Apache after making the required changes. 

### Conclusion

I hope this post came in useful for some people. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.