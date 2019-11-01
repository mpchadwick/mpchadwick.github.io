---
layout: blog-single
title:  "Whitelisting Your Load Test Server IP at Cloudflare"
date: October 31, 2019
image: /img/blog/cloudflare-load-test/cloudflare-access-rule@2x.png
tags: [Tools]
---

Recently I needed to load test an application that sat behind Cloudflare. I tried Google and didn't find much beyond a thread on the Cloudflare forum's titled ["How to whitelist load testing IPs"](https://community.cloudflare.com/t/how-to-whitelist-load-testing-ips/51007).

The thread concludes with sandro [suggesting](https://community.cloudflare.com/t/how-to-whitelist-load-testing-ips/51007/4) using an "access rule".

<!-- excerpt_separator -->

But what is an access rule?

At first it seemed it was something you'd configure via the "Access" link in the Cloudflare dashboard.

<img
  class="rounded shadow"
  src="/img/blog/cloudflare-load-test/cloudflare-dashboard@1x.png"
  srcset="/img/blog/cloudflare-load-test/cloudflare-dashboard@1x.png 1x, /img/blog/cloudflare-load-test/cloudflare-dashboard@2x.png 2x"
  alt="Screenshot showing Cloudflare dashboard">

However, when I read the description of Cloudflare Access I became skeptical as to whether or not I was in the right place...

> Access protects internal resources by authenticating against identity providers you already use. With Access, you can control which users and groups can reach sensitive materials without a VPN or making code changes to your site.
 
Fortunately some more careful Googling brought me to the ["Configuring IP Access Rules"](https://support.cloudflare.com/hc/en-us/articles/217074967-Configuring-IP-Access-Rules) Cloudflare Support article.

I can confirm that I was able to load test the site successfully by configuring a "Whitelist" access rule as instructed in that support article. 

<img
  class="rounded shadow"
  src="/img/blog/cloudflare-load-test/cloudflare-access-rule@1x.png"
  srcset="/img/blog/cloudflare-load-test/cloudflare-access-rule@1x.png 1x, /img/blog/cloudflare-load-test/cloudflare-access-rule@2x.png 2x"
  alt="Screenshot showing setting up an IP Access Rule in Cloudflare">