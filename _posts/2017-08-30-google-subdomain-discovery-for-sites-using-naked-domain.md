---
layout: blog-single
title:  Google Subdomain Discovery For Sites Using Naked Domain
description: Using Google to discover subdomains and filtering out the naked domain
date: August 30, 2017
image: /img/blog/google-subdomain-naked/jet-google-search-1@1x.jpg
tags: [Security]
---

In [a blog post from Bugcrowd titled "Discovering Subdomains"](https://blog.bugcrowd.com/discovering-subdomains), [Google dorking](https://en.wikipedia.org/wiki/Google_hacking) is the first strategy covered...

> The site directive will filter results only to your target:
> 
> site:paypal.com
> 
> After we have the initial domain in there we can use the -inurl directive.
> 
> site:paypal.com -inurl:www
> 
> Each subdomain we find can then be filtered out with more -inurl directives to make place for others:
> 
> site:paypal.com -inurl:www -inurl:shopping

This strategy for identifying subdomains is very convenient, but what about if the target is using their naked domain instead of www?

<!-- excerpt_separator -->

This is an issue I struggled with a bit. For example, Jet.com for which [any part of *.jet.com is in scope on Bugcrowd](https://bugcrowd.com/jet) (unless explicity mentioned as out of scope) uses a naked domain.

<img
  class="rounded shadow"
  src="/img/blog/google-subdomain-naked/jet-google-search-1@1x.jpg"
  srcset="/img/blog/google-subdomain-naked/jet-google-search-1@1x.jpg 1x, /img/blog/google-subdomain-naked/jet-google-search-1@2x.jpg 2x"
  alt="Googling for Jet.com including naked domain">

However, after some time, the solution became obvious.

inurl: looks at the **entire** url, so we can filter out the naked domain by including everything starting from the protocol...

<img
  class="rounded shadow"
  src="/img/blog/google-subdomain-naked/jet-google-search-2@1x.jpg"
  srcset="/img/blog/google-subdomain-naked/jet-google-search-2@1x.jpg 1x, /img/blog/google-subdomain-naked/jet-google-search-2@2x.jpg 2x"
  alt="Googling for Jet.com with naked domain filtered">

It worked perfectly!

Happy hacking :smiley: