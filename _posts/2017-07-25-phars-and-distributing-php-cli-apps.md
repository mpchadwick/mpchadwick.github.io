---
layout: blog-single
title: Phars and distributing PHP CLI apps
description: A look at the options for packaging and distributing a CLI app written in PHP which, unfortunately, are not great.
date: July 25, 2017
image: /img/blog/phars-and-distributing-php-cli-apps/php.jpg
tags: [PHP]
ad: domain-clamp-ad-b.html
has_tweet: true
---

First things first, let's address a question that I couldn't easily find an answer to on Google. Is PHP required to execute a phar?

The answer is a loud and clear **yes**.

In fact, not only is PHP required to execute a phar, but the version of PHP installed on the system that will execute the phar must be in line with the version of PHP used by the phar author.

<!-- excerpt_separator -->

This is due to the nature of what a phar is. A phar is not a compiled standalone binary, like you'd generate with `gcc` or `go build`. Instead it's a way to bundle an entire project into a single standalone package for easy distribution.

For example, if we look at the first few lines of the composer.phar we'll see the following...

```
$ head /usr/local/bin/composer
#!/usr/bin/env php
<?php
/*
 * This file is part of Composer.
 *
 * (c) Nils Adermann <naderman@naderman.de>
 *     Jordi Boggiano <j.boggiano@seld.be>
 *
 * For the full copyright and license information, please view
 * the license that is located at the bottom of this file.
$
```

As we can see it's just a bunch of PHP with a shebang at the top instructing the shell to use PHP to execute the file.

While phars, are a handy way to distribute CLI tools for PHP developers such as [composer](https://getcomposer.org/), [PHPUnit](https://phpunit.de/), or [n98-magerun](https://github.com/netz98/n98-magerun) unfortunately, they're not a great option for publishing software which may be used outside to PHP community. For example I started writing [a Symfony Console based security checking tool](https://github.com/mpchadwick/cookie-sec-checker) which I was thinking about distributing as a phar. However, after spending a bit more time understanding what phars actually are, I've begun to question this choice as I don't want to make having PHP installed a requirement for using the tool.

And even with tools targeting PHP developers, distributing phars typically prevents authors from using new PHP features in order to support users with older versions of PHP installed. For example, [n98-magerun still supports PHP 5.3](https://github.com/netz98/n98-magerun#compatibility).

### Phar alternatives

So what are the alternatives for packaging and delivering software written in PHP for users to execute themselves. Unfortunately the options are not great...

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">And a couple other options listed here depending on your needs / audience <a href="https://t.co/2m3oItTfN1">https://t.co/2m3oItTfN1</a></p>&mdash; hardy johnson (@hardyjohnson) <a href="https://twitter.com/hardyjohnson/status/887924769974214656">July 20, 2017</a></blockquote>

[Phalanger](https://github.com/devsense/phalanger) is the only thing that is appears to be actively maintained. However, it converts PHP to .NET, not exactly what I'm looking for.

To quickly run through the other projects listed..

**Facebook's HipHop**

This was discontinued in 2013 in favor of HHVM, which is not a compiler.

**Roadsend**

[This project](https://github.com/weyrick/roadsend-php) has not been updated since 2012.

**phc**

[This project](https://github.com/pbiggar/phc) is officially unmaintained

While I'd love to be wrong about this (please tell me I am), there don't seem to be any good options for packaging and distributing CLI tools written in PHP to users who may not have PHP installed. As such, it's looking like I'll need to start over writing the project in go :disappointed:
