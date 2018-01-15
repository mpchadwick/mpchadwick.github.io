---
layout: blog-single
title:  Getting The PHP-FPM Status From The Command Line
description: You can't curl PHP-FPM directly because it doesn't use HTTP. Here I outline how you _can_ talk directly to PHP-FPM.
date: October 24, 2017
image:
tags: [Shell, Tools, PHP]
---

Today, I posted the following into my company's HipChat...

> [3:41 PM] Me:
>
> 
> $ curl 127.0.0.1:9000/status<br>
> curl: (56) Failure when receiving data from the peer
>
>
> Is this supposed to work?

I quickly learned that no, it is not supposed to work...

> [3:41 PM] Coworker:
>
> no it doesn't use http

Here I'll go into details on how you can get the PHP-FPM status from the command line. 

<!-- excerpt_separator -->

### The `cgi-fcgi` executable

In order to communicate with a FastCGI application (like PHP-FPM) you can use the `cgi-fcgi` executable. It does not come installed by default on most OSes.

Per the article ["Directly connecting to PHP-FPM" from www.thatsgeeky.com](https://www.thatsgeeky.com/2012/02/directly-connecting-to-php-fpm/) you can `yum install` it as follows...

```
$ yum --enablerepo=epel install fcgi
```

I personally tested the `yum install` out on a CentOS machine and it worked fine.

If you're using `apt`, according to [easyengine.io's similarly titled blog post "Directly connect to PHP-FPM"](https://easyengine.io/tutorials/php/directly-connect-php-fpm/) it is available as follows...

```
$ apt-get install libfcgi0ldbl
```

Once installed you'll be able to use the `cgi-fcgi` binary to talk directly to PHP-FPM.

### Ensuring That The Status Page Is Available

By default, PHP-FPM does not make the status page available. You'll need to ensure that the following is included in your PHP-FPM configuration...

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: You don't need to use `/status` for the path and can use another path if you'd prefer.</p>
</div>

```
pm.status_path = /status
```

### Communicating With PHP-FPM

At this point you'll be able to use `cgi-fcgi` to send requests directly to PHP-FPM. However it's important to confirm whether or not PHP-FPM is listening on a port or a unix socket.

If listening on a port you'll see something like this in your PHP-FPM configuration...

```
listen = 127.0.0.1:9000
```

On a Unix socket you'll see this...

```
listen = /var/run/php-fpm/www.sock
```

If PHP-FPM is listening on a port you can send requests to it with `cgi-fcgi` as follows...

```
$ SCRIPT_NAME=/status \ 
  SCRIPT_FILENAME=/status \
  REQUEST_METHOD=GET \
  cgi-fcgi -bind -connect 127.0.0.1:9000
```

If it's listening on a socket simply update the connection name to point to the Unix socket.

```
$ SCRIPT_NAME=/status \
  SCRIPT_FILENAME=/status \
  REQUEST_METHOD=GET \
  cgi-fcgi -bind -connect /var/run/php-fpm/www.sock
```

When connecting to a Unix socket, you need to ensure the user you're running the command as has permissions to read the socket file.
