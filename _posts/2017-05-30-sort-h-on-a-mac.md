---
layout: blog-single
title: sort -h on a Mac
description: Out-of-the-box Mac does not support the -h flag for the sort command. Here, I'll show you how to deal with that.
date: May 30, 2017
image: /img/blog/sort-h-on-a-mac/sort-h-on-a-mac.jpg
tags: [Tools, Shell]
ad: domain-clamp-ad-b.html
---

`du -sh * | sort -hr` is my favorite command for quickly looking at how much space directories are taking up on a machine. For example, in the root of a Magento 2 installation you'll see the following...

```
$ du -sh * | sort -hr
317M	vendor
100M	pub
 35M	dev
 25M	var
 25M	lib
 19M	update
7.5M	setup
460K	composer.lock
428K	CHANGELOG.md
196K	app
 32K	LICENSE_EE.txt
 12K	phpserver
 12K	LICENSE_AFL.txt
 12K	LICENSE.txt
8.0K	nginx.conf.sample
8.0K	bin
4.0K	php.ini.sample
4.0K	package.json.sample
4.0K	index.php
4.0K	composer.json
4.0K	README_EE.md
4.0K	ISSUE_TEMPLATE.md
4.0K	Gruntfile.js.sample
4.0K	COPYING.txt
4.0K	CONTRIBUTING.md
```

However, if you run this command on a Mac here's what you'll get...

```
$ du -sh * | sort -hr
sort: invalid option -- h
Try `sort --help' for more information.
```

<!-- excerpt_separator -->

Fortunately, per [this StackExchange answer](https://serverfault.com/questions/62411/how-can-i-sort-du-h-output-by-size#answer-156648) you can work around this by [`brew install`-ing `coreutils`](https://brew.sh/).

Doing so, will give you a new executable, `gsort`, which supports the `-h` flag.

I've added the following alias to my `.zshrc` so I don't even have to think about it...

```
alias sort=gsort
```
