---
layout: blog-single
title:  "Why 404s Aren't Cached in Adobe Commerce"
date: November 22, 2024
image: /img/blog/adobe-commerce-404-cache/commit@2x.jpg
tags: [Adobe Commerce]
related_posts:
---

Recently I was investigating an outage on a client website where a large spike in traffic generating a 404 response was at play.

<img
  class="rounded shadow"
  src="/img/blog/adobe-commerce-404-cache/traffic_spike@1x.jpg"
  srcset="/img/blog/adobe-commerce-404-cache/traffic_spike@1x.jpg 1x, /img/blog/adobe-commerce-404-cache/traffic_spike@2x.jpg 2x"
  alt="Screenshot of traffic spike">

Reviewing the requests in detail, I noticed that the same URLs were being hit repeatedly within a short time frame, however the responses never came from cache.

This lead me to the question...why wouldn't a 404 response be served from cache? I reached out to Adobe support and learned a few things. In this post I will share my findings.

<!-- excerpt_separator -->

### Keeping the response "fresh"

The initial explanation I got from Adobe was essentially that the page contents of the could change (e.g. an item comes back in stock) so it's best not to cache the 404 page to make sure each user sees a fresh response each time. 

That made sense to me to some degree, however on the flip side, when the outage that occured the same page was being loaded repeatedly in a very short period of time causing the site to beecome unstable. I thought a happy medium might be to cache the page, but only for a short amount of time (e.g. 5 minutes).

### The security concern

As I began to figure out how to implement caching of the 404 page I stumbled upon the commit which originally prevented 404 caching. The commit added the following directive to `Magento\Cms\Controller\Noroute\Index::execute`.

```
$resultPage->setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0', true);
```

Looking closely at the commit, I noticed the author name was "pawan-adobe-security".

<img
  class="rounded shadow"
  src="/img/blog/adobe-commerce-404-cache/commit@1x.jpg"
  srcset="/img/blog/adobe-commerce-404-cache/commit@1x.jpg 1x, /img/blog/adobe-commerce-404-cache/commit@2x.jpg 2x"
  alt="Screenshot of commit">

**Commit**: [https://github.com/magento/magento2/commit/b91e690faf2056861276db10d99acfe83a1bdc06](https://github.com/magento/magento2/commit/b91e690faf2056861276db10d99acfe83a1bdc06)

The fact that "security" was in the username set off some alarm bells to me. I followed up with Adobe for more details and they shared the following scenario.

1. User A leaves a review for Product X. User A will have access to view the review via their account at e.g. `example.com/review/customer/view/id/XXX`
2. User B sends a request to `example.com/review/customer/view/id/XXX` prior to User A having visited it. The response is a 404 which is now cached
3. User A can now tries to view the review from their account, however they can't as the 404 response has been cached

I realized this is technically a type of a denial of service, and it could be expanded to other endpoints such as viewing an order from the customer's account.

While the likelyhood of abuse seems low, `no-cache`-ing the 404 seems to be a necesary evil to prevent this potential abuse scenario.