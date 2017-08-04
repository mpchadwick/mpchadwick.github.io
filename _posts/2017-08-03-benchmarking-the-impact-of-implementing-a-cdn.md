---
layout: blog-single
title: Benchmarking the Impact of Implementing a CDN
description: A look at the impact a CDN has on site speed under various conditions
date: August 03, 2017
image:  /img/blog/benchmarking-cdn/graph.jpg
tags: [Caching, Networking, Performance]
ad: domain-clamp-ad-b.html
---

In [a talk I'm preparing titled, "Imagining A World Without Caching"](https://nomadmage.com/performance-not-caching-really/), I'm benchmarking the impact of many different forms of caching. One type of caching that the talk covers is "edge caching" a.k.a. [content delivery networks (CDNs)](https://en.wikipedia.org/wiki/Content_delivery_network). I spent a lot of time on Google trying to find hard data showing the impact that implementing a CDN had on page load times. Unfortunately, after nearly an hour of Googling, I couldn't find the data I was looking for.

As such, I decided to do my own benchmarking. Here, I'll share my data.

<!-- excerpt_separator -->

### The CDN

The purpose of this investigation was not to compare one CDN to another, but rather to understand the impact of implementing any CDN. That being said, it is important to note that [Cloudflare](https://www.cloudflare.com/) was used for this benchmarking.

### The Origin

It is also relevant to know the origin in use during this benchmarking. In this case, the origin was [GitHub Pages](https://help.github.com/articles/what-is-github-pages/). `A` records for GitHub Pages point to `192.30.252.153` and `192.30.252.154`. According to [MaxMind](https://www.maxmind.com/en/geoip-demo) those addresses are located in San Francisco.

### The Test Location

The impact of a CDN is much greater when the distance of the user making the request is very far from the origin. As such, all benchmarking was done from Australia. [WebPagetest](https://www.webpagetest.org/) was used to generate the requests.

### Benchmarking Properly

It is important to remove variables that differ in how the origin or the CDN serve responses. For example, in [this blog post](https://thethemefoundry.com/blog/why-we-dont-use-a-cdn-spdy-ssl/) the author draws the conclusion that a CDN is not beneficial. However, the underlying problem is that the CDN the author used was incapable of using SPDY, which he could use from his origin server.

In our case, both the origin, and the CDN are capable of using HTTP/2.

Additionally, each test variation was run 5 times and the totals were averaged to mitigate against anomalies.

### Requesting A Page on This Blog

I started out by doing some tests linking to a [post on this blog]({{ site.baseurl }}{% link _posts/2017-03-03-against-list-view.md %}). The requests were made over a Cable (5/1 Mbps 28ms RTT) connection.

Here's the data...

|Cache Status|First Byte|Start Render|Speed Index|Load Time|Links
|---|---|---|---|---|---|
|Miss|0.840|1.725|2779|3.020|[1](https://www.webpagetest.org/result/170708_M1_b1142e2161450f8925d93e150dfb2536/) / [2](https://www.webpagetest.org/result/170709_JT_6e04ac2b94098576d9c3e8938c7f0352/) / [3](https://www.webpagetest.org/result/170710_64_617dbbc384cb5d73a5befda95ddb57bd/) / [4](https://www.webpagetest.org/result/170710_45_1ac3d52e6bd11a42169e8d1bff7d2115/) / [5](https://www.webpagetest.org/result/170710_Z1_43ce6e834d8e268d7c933924f1c19c9c/)|
|Hit|0.800 (-4.79%)|1.514 (-12.25%)|2465 (-11.30%)|2.507 (-15.12%)|[1](https://www.webpagetest.org/result/170708_PY_5d4cd7f0d0ab3d1192859ce7d1574fc9/) / [2](https://www.webpagetest.org/result/170710_KX_749cb0b42c2f02ef0d34494b67641e36/) / [3](https://www.webpagetest.org/result/170710_R6_b1502c6146baa43c52c23c369e22c2c0/) / [4](https://www.webpagetest.org/result/170710_WM_1ad4cc2349ff8f4878a2bdc55eab8ab0/) / [5](https://www.webpagetest.org/result/170710_5G_09303dcf2ee21f09f2adb9ac61faa3a3/)|

We can see that while time-to-first-byte is more or less unchanged, we experienced a modest reduction in the start render time, the speed index and the load time thanks to the CDN.

### Requesting A Page From An Ecommerce Website

The post on this blog used for benchmarking loads significantly less assets than something like an ecommerce website would. As such, I next decided to test a sample ecommerce page. 

I used `wget` to capture the static HTML and page requisites for [the "Men's Jackets" product listing page in an out of box Magento 2 installation with sample data](https://maxchadwick.xyz/luma-static/mens-jackets-15/). So how did that play out?

|Cache Status|First Byte|Start Render|Speed Index|Load Time|Fully Loaded[1]|Link
|---|---|---|---|---|---|---|
|Miss|0.890|2.733|2857|4.398|4.824|[1](https://www.webpagetest.org/result/170708_0Y_9b458231e88b18820ddcc3a76cdb1e4d/) / [2](https://www.webpagetest.org/result/170710_S6_91fbee0d52f61beece9b4949fcead62a/) / [3](https://www.webpagetest.org/result/170710_CB_6a8c0b664debe4c0ea55d11d26a9f468/) / [4](https://www.webpagetest.org/result/170710_79_a7c03a39c1275d2114812ee217b3d718/) / [5](https://www.webpagetest.org/result/170710_NY_0db24cae1711fc161c6487781907e794/)|
|Hit|0.8432 (-5.24%)|2.325 (-14.92%)|2475 (-13.37%)|2.748 (-37.51%)|2.854 (-40.83%)|[1](https://www.webpagetest.org/result/170708_MY_a5866671c52af5357e64105f5ce4e2e5/) / [2](https://www.webpagetest.org/result/170710_QD_bd7edff8d156dda87b32f65cf1456c36/) / [3](https://www.webpagetest.org/result/170710_8R_275163e45d1dd7919e11cefb08614065/) / [4](https://www.webpagetest.org/result/170710_F8_71f247206b50226baa3a7a85e8038b17/) / [5](https://www.webpagetest.org/result/170710_7J_797e97312cdb324d395d331083c9d873/)|

Here, we can see that while, the reduction in metrics like time-to-first-byte, start render and speed index are about the same as the blog post, load time and fully loaded show a much more significant decrease as a result of the CDN.

1\. Note that fully loaded was intentionally omitted from the results table for my blog post. This is because of scripts injected into the page by Disqus and Google Analytics which I have no control over. However, in the case of the ecommerce page test, there are no 3rd party scripts at play.

### What If We Cache The HTML Document?

In both the test cases above, Cloudflare not configured to cache HTML documents - which is it's default configuration. So next, I decided to explore the impact of the CDN if the HTML document is additionally served from cache. Here are the results for [the blog post]({% link _posts/2017-03-03-against-list-view.md %}) again...

|Cache Status|First Byte|Start Render|Speed Index|Load Time|Link
|---|---|---|---|---|---|
|Miss|0.840|1.725|2779|3.020|[1](https://www.webpagetest.org/result/170708_M1_b1142e2161450f8925d93e150dfb2536/) / [2](https://www.webpagetest.org/result/170709_JT_6e04ac2b94098576d9c3e8938c7f0352/) / [3](https://www.webpagetest.org/result/170710_64_617dbbc384cb5d73a5befda95ddb57bd/) / [4](https://www.webpagetest.org/result/170710_45_1ac3d52e6bd11a42169e8d1bff7d2115/) / [5](https://www.webpagetest.org/result/170710_Z1_43ce6e834d8e268d7c933924f1c19c9c/)|
|Hit|0.433 (-48.48%)|1.213 (-29.69%)|2108 (-24.13%)|2.060 (-31.79%)|[1](https://www.webpagetest.org/result/170709_AZ_78dad4f36636d0b5b4edd5e7c8599936/) / [2](https://www.webpagetest.org/result/170710_R0_58c7b0f5d6f1dc1f40d7f0e89fa9ee3e/) / [3](https://www.webpagetest.org/result/170710_40_251deecd199ec0c47c16442435652bbb/) / [4](https://www.webpagetest.org/result/170710_FT_a3f10b85050687ac9268b0c3a4bdeb63/) / [5](https://www.webpagetest.org/result/170710_FT_a3f10b85050687ac9268b0c3a4bdeb63/)|

As you can see, serving the HTML from cache greatly improves the impact of a CDN. This is mainly because it reduces the time-to-first-byte (because the request does not need to reach the origin for the HTML document).

### What About Choppy Network Conditions?

In all the above benchmarks, the request was made with WebPagetest's Cable (5/1 Mbps 28ms RTT) connection. The final question I had was how much of a difference does a CDN make with choppy network conditions. I decided to re-run the test with WebPagetest's Mobile 3G (1.6 Mbps/768 Kbps 300ms RTT) connection. I used [the blog post]({% link _posts/2017-03-03-against-list-view.md %}) again, and kept HTML document caching on. Here are the results...

|Cache Status|First Byte|Start Render|Speed Index|Load Time|Link
|---|---|---|---|---|---|
|Miss|1.960|3.226|5332|5.838|[1](https://www.webpagetest.org/result/170709_31_83ba0998531670dcad2d0f83778231e0/) / [2](https://www.webpagetest.org/result/170710_VQ_9774c676d3105382e54b7de3cdbe95b6/) / [3](https://www.webpagetest.org/result/170710_M3_98daa0982b9f3bb48416feadebe1204f/) / [4](https://www.webpagetest.org/result/170710_RA_58340f50f47949a8f9d46b7e9a9bef3e/) / [5](https://www.webpagetest.org/result/170710_ZZ_81b77aaf5853615bab2bbc04b5fbe187/)|
|Hit|1.500 (-23.47%)|2.266 (-30.49%)|4076 (-24.53%)|4.672 (-20.26%)|[1](https://www.webpagetest.org/result/170709_QK_57e15a1ba68d19224a1cb1c8c31e3719/) / [2](https://www.webpagetest.org/result/170710_69_2f599c7db53491375821b2b0939b9928/) / [3](https://www.webpagetest.org/result/170710_HT_66ebd4d3eac0b50e7c016db85b4b6e6e/) / [4](https://www.webpagetest.org/result/170710_2A_43fded2887701ff7b92138330d1ae474/) / [5](https://www.webpagetest.org/result/170710_XJ_f06027a97c0c6d5a6b26c4fd9ec9695a/)|

The savings of a CDN over choppy network conditions were not exponentially greater (as I thought they might be), but rather proportional to the savings over cable for start render, speed index and load time. However, time-to-first-byte was reduced by roughly the same amount (~400ms) leading to a less significant impact, percentage-wise.

### Conclusions

Based on my testing I have drawn the following conclusions...

- The more assets your webpage requires (images, styles, scripts) the greater the impact you'll see using a CDN
- If you can serve the **entire** response from the edge, including the HTML document, you'll see much more dramatic impact in terms of time-to-first-byte, start render AND speed index
- The amount of improvement is more-or-less the same regardless of network conditions - slow network conditions will not see exponential improvements by using a CDN

Hope you found this data interesting / useful. If you think I got something wrong or have anything else to say about this, let me know in the comments below.

