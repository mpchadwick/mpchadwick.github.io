---
layout: blog-single
title:  "Fastly Timeouts Caused By Request Collapsing"
date: January 7, 2021
image: 
tags: [Networking, Caching]
related_posts:
- "Magento Cloud Response Times as measured by Fastly in New Relic"
- "Benchmarking the Impact of Implementing a CDN"
- "HTTP Request Header Size Limits"
---

Recently I was involved in diagnosing an odd issue. For a specific page on a website, customers were experiencing extremely slow responses, frequently timing out with the following message.

```
Timed out while waiting on cache-dca17735-DCA
```

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: <code>cache-dca17735-DCA</code> in this case refers to Fastly's DCA data center in Ashburn, VA. (See: <a href="https://www.fastly.com/release-notes/q2-17-q3-17">https://www.fastly.com/release-notes/q2-17-q3-17</a>). This aspect of the response would change from user to user, however the "Timed out while waiting on" part was consistent.</p>
</div>

However, when we looked at the application backend we saw no sign that it was unhealthy in any way. While we did see that throughput was slightly elevated for the route in question, average server response times were quick, and there were no signs that any of the infrastructure was overloaded.

<!-- excerpt_separator -->

We reported the issue to Fastly support, who advised that it was likely caused [Request collapsing](https://developer.fastly.com/learning/concepts/request-collapsing/). I'm not 100% sure of the conditions that can lead to this happening but, the following were at play for us:

- Throughput to the problematic URL was slightly elevated
- The URL would return a 307 response code, for which Fastly supported advised `beresp.cacheable` would be set to `false` (Reference: [https://docs.fastly.com/en/guides/http-status-codes-cached-by-default](https://docs.fastly.com/en/guides/http-status-codes-cached-by-default)).

Apparently request collapsing creates a queue for requests, which can become backed up if a specific URL gets enough traffic under the right conditions.

The fix they suggested was to add a `return (pass)` targeting this specific URL to the `vcl_recv` subroutine.

```
sub vcl_recv {
    if (req.url.path ~ "/problem-url") {
        return(pass);
    }
}
```

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: For Magento users this can be done via a <a href="https://github.com/fastly/fastly-magento2/blob/1.2.152/Documentation/Guides/CUSTOM-VCL-SNIPPETS.md">Custom VCL snippet</a></p>
</div>

Upon implementing this change we found that the issue no longer occured.