---
layout: blog-single
title: Firefox Reporting Disqus Hosts as Missing from default-src
date: April 13, 2020
image: 
tags: [Security]
---

I recently [set up a Content Security Policy (CSP) on this website]({{ site.baseurl }}{% post_url 2020-04-11-cloudflare-worker-csp %}).

My site uses Disqus, so my Content-Security-Policy had their domains whitelisted something like this:

```
default-src
  'self';

script-src
  'self'
  c.disquscdn.com
  ...;
```

<!-- excerpt_separator -->

However, after deploying the Content-Security-Policy I noticed I was getting reports like this, specifically from Firefox:

```
{
    "csp-report": {
        "blocked-uri": "https://c.disquscdn.com/next/embed/lounge.bundle.66651ad59b7dd01c893000c33250bd93.js",
        "document-uri": "https://maxchadwick.xyz/blog/concatenate-a-string-and-an-int-in-go",
        "original-policy": "default-src 'self'; script-src 'self' https://c.disquscdn.com ...",
        "violated-directive": "default-src"
    }
}
```

As you can see, the `blocked-uri` is a `.js` file loaded from `c.disquscdn.com` which is clearly whitelisted under the `script-src` directive. Why would Firefox complain about this?

After a bit of research I found this piece of information in [an article titled "Implementing Content Security Policy" published on hacks.mozilla.org](https://hacks.mozilla.org/2016/02/implementing-content-security-policy/).

> If you rely on prefetching, you might encounter problems with default-src 'none'. On AMO, we discovered that browser prefetching in Firefox will not be identified as a specific content type, therefore falling back to default-src. If default-src doesn’t cover the origin involved, the prefetched resource will be blocked. There’s a [bug open with additional information on this issue](https://bugzilla.mozilla.org/show_bug.cgi?id=1242902).
>
> [https://hacks.mozilla.org/2016/02/implementing-content-security-policy/](https://hacks.mozilla.org/2016/02/implementing-content-security-policy/)

I checked the document and lo and behold Disqus had appended a `<link rel="prefetch">` for the asset in question.

<img
  class="rounded shadow"
  src="/img/blog/firefox-csp-default-src/firefox-default-tools-disqus-prefetch@1x.png"
  srcset="/img/blog/firefox-csp-default-src/firefox-default-tools-disqus-prefetch@1x.png 1x, /img/blog/firefox-csp-default-src/firefox-default-tools-disqus-prefetch@2x.png 2x"
  alt="Screenshot of HTML document showing Disqus prefetch link tag">

In my case I decided to update `default-src` to additionally include these hosts. As I've already put my trust in them by whitelisting them under `script-src` I don't see any additional danger to doing this (not to mention the fact that there doesn't appear to be any other alternative, other than just ignoring the reports).