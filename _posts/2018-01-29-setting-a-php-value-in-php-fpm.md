---
layout: blog-single
title:  "Setting a php_value in PHP&#x2011;FPM"
description: An exploration of the many options available for setting a php_value in an environment running PHP-FPM
date: January 29, 2018
last_modified_at: July 2, 2018
image: 
tags: [PHP]
---

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: The example used in this post is setting PHP's <code>error_reporting</code> level, which is <a href="https://bugs.php.net/bug.php?id=71340#1525616824">no longer supported as of PHP 7.0</a>. Regardless approaches documented in this post are still applicable for setting other <code>php_value</code>s</p>
</div>

Recently I needed to adjust PHP's [`error_reporting`](http://php.net/manual/en/function.error-reporting.php) level.

The goal was to set it to `E_ALL & ~E_NOTICE` which would silences notices.

The project in question was a Magento deployment, where it's never advisable to modify core files (e.g. index.php). As such, I Googled "htaccess error_reporting E_ALL & ~E_NOTICE", with hopes of making the change in the .htaccess file.

<!-- excerpt_separator -->

I landed on the Stack Overflow question ["How to disable notice and warning in PHP within .htaccess file?
"](https://stackoverflow.com/questions/8652933/how-to-disable-notice-and-warning-in-php-within-htaccess-file) where I found the following answer...

> Try:
> 
> `php_value error_reporting 2039`
> 
> [https://stackoverflow.com/a/8652983/2877224](https://stackoverflow.com/a/8652983/2877224)

I added that to the .htaccess, refreshed the page and got a 500 error.

<img
  class="rounded shadow"
  src="/img/blog/setting-a-php-value-in-php-fpm/500-error@1x.jpg"
  srcset="/img/blog/setting-a-php-value-in-php-fpm/500-error@1x.jpg 1x, /img/blog/setting-a-php-value-in-php-fpm/500-error@2x.jpg 2x"
  alt="500 Error">

Crap :see_no_evil:

Looking in the logs I found the following error.

```
[Mon Jan 29 21:09:14.856002 2018] [core:alert] [pid 34416:tid 123145425289216] [client ::1:62547] /var/www/html/.htaccess: Invalid command 'php_value', perhaps misspelled or defined by a module not included in the server configuration
```
{:.wrap}

After a bit of research I realized the issue was that the answer I found only works with mod_php, but the project in question was using PHP-FPM.

In this post, let's take a look at the option for setting a php_value when using PHP&#x2011;FPM.

### .user.ini Files

The first option for setting `php_value`s is to use [.user.ini files](http://php.net/manual/en/configuration.file.per-user.php). For the Magento project in question this was just a matter of dropping a .user.ini in the root next to index.php and .htaccess with the following.

```
error_reporting = E_ALL & ~E_NOTICE
```

This works quite well and is the [top answer](https://stackoverflow.com/a/35279997/2877224) to the Stack Overflow question ["Equivalent of php_value under Apache + php-fpm
"](https://stackoverflow.com/questions/35265082/equivalent-of-php-value-under-apache-php-fpm)

Note that there is some caching at play with .user.ini files, so you might not see your changes right away. From the PHP documentation...

> `user_ini.cache_ttl` controls how often user INI files are re-read. The default is 300 seconds (5 minutes).

### PHP-FPM conf Files

Another place `php_value`s can be set is within PHP-FPM conf files. The default `www.conf` file explains how this works...

```
; Additional php.ini defines, specific to this pool of workers. These settings
; overwrite the values previously defined in the php.ini. The directives are the
; same as the PHP SAPI:
;   php_value/php_flag             - you can set classic ini defines which can
;                                    be overwritten from PHP call 'ini_set'.
;   php_admin_value/php_admin_flag - these directives won't be overwritten by
;                                     PHP call 'ini_set'
; For php_*flag, valid values are on, off, 1, 0, true, false, yes or no.
```

A couple things here are interesting...

- Notice the language 'These settings overwrite the values previously defined in the php.ini'. This includes `.user.ini`, so if `php_value`s are set in PHP-FPM conf files, `.user.ini` overrides don't work.
- Also, notice the language 'these directives won't be overwritten by PHP call 'ini_set''. In other words there's no way to override settings defined via `php_admin_value` and `php_admin_flag`.

In order adjust `error_reporting` through a PHP-FPM conf file I'd create a new file named e.g. `99-user.conf` with the following

```
php_value[error_reporting] = E_ALL & ~E_NOTICE
```

### The .htaccess Option

There is an `.htaccess` option outlined in [another answer](https://stackoverflow.com/a/45442812/2877224) to the ["Equivalent of php_value under Apache + php-fpm"](https://stackoverflow.com/questions/35265082/equivalent-of-php-value-under-apache-php-fpm) Stack Overflow question.

The following can be added to .htaccess...

```
SetEnv PHP_VALUE "error_reporting = 2039"
```

However, this has a major limitation in that you can only set one `PHP_VALUE` this way, because if you tried to to do...

```
SetEnv PHP_VALUE "error_reporting = 2039"
SetEnv PHP_VALUE "post_max_size = 16M"
```

...the second line would override the `PHP_VALUE` environment variable value from the first line, preventing the first line from actually working.