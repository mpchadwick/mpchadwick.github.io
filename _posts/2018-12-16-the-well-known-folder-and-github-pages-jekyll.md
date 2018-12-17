---
layout: blog-single
title:  "Using the .well-known/ folder on a GitHub Pages hosted Jekyll&nbsp;site"
description: A guide for how you can put files in the .well-known folder when running Jekyll on GitHub pages
date: December 14, 2018
image:
tags: [Jekyll]
---

Recently I registered this site for [Brave Rewards](https://brave.com/publishers).

There were two options for doing this:

1. Upload a file to the `.well-known/` directory on the website
2. Create a DNS record

I decided to opt for the former.

Initially, I thought it was as simple [commiting the file to the repo in the specified location](https://github.com/mpchadwick/mpchadwick.github.io/commit/d4d4e40284b604a651a06ecaa49962af57ade349). However, after pushing and letting the site build I got a 404 when attempting to access [https://maxchadwick.xyz/.well-known/brave-payments-verification.txt](https://maxchadwick.xyz/.well-known/brave-payments-verification.txt).

<!-- excerpt_separator -->

Some quick Googling lead me to [keybase/keybase-issues GitHub issue #366](https://github.com/keybase/keybase-issues/issues/366).

After scrolling thourgh the comments I saw [the following suggestion:](https://github.com/keybase/keybase-issues/issues/366)

> With Jekyll on GitHub Pages just add a file keybase.txt in your root and add the following header:
> 
> ```
> layout: none
> permalink: .well-known/foo.txt
> ```

I [made the update](https://github.com/mpchadwick/mpchadwick.github.io/commit/3073791cc388f94888c69ab2e1c7683642d3f770) and pushed again. I then reloaded the page and saw expected response. Mission accomplished :boom:
