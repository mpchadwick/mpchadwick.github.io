---
layout: blog-single
title:  "Chrome Developer Tools Network Tab Filter by 'not' status code"
date: January 10, 2025
image: 
tags: [Tools]
related_posts:
---

Recently a co-worker reported sporadic 500-range errors on a website he was performing testing on. I was trying to gather some information on what was happening and wanted to use the "Network" tab in Chrome DevTools to show me the following requests

1. Only requests to the domain of the specific website (e.g. filter out all 3rd party requests)
2. All non 200 responses


Step one I knew how to do...in the filter search enter `domain:example.com` (replacing `example.com` with the actual domain for the project), however I was unsure how to complete the second step.

<!-- excerpt_separator -->

Through some Googling I eventually discovered that it is possible to do a negative search by pre-pending the `-` symbol to the field on which you are filtering.

Putting this all together, I landed on the following filter search

```
domain:example.com -status-code:200
```

Here's a screenshot of how the looks in DevTools when visiting `amazon.com`.

<img
  class="rounded shadow"
  src="/img/blog/chrome-dev-tools-filter-not/dev-tools-filter@1x.png"
  srcset="/img/blog/chrome-dev-tools-filter-not/dev-tools-filter@1x.png 1x, /img/blog/chrome-dev-tools-filter-not/dev-tools-filter@2x.png 2x"
  alt="Screenshot of filtering in DevTools network panel">
  
Hope you find this helpful.