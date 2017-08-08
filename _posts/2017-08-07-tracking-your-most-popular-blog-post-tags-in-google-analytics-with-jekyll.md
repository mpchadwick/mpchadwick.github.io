---
layout: blog-single
title: Tracking Your Most Popular Blog Post Tags in Google Analytics with Jekyll
description: Knowing which tags users are viewing can you decide which topics to write about. This post outlines a solution for tracking tag views.
date: August 07, 2017
image: /img/blog/tracking-blog-tags/events-on-my-blog@2x.jpg
tags: [Google Analytics, Jekyll]
---

Tagging is a feature built into most blogging platforms. Typically tags differ from categories in that there are many more of them on your site and a larger number of them are applied to a specific post. Here's how WordPress describes the difference...

> Tags are similar to categories, but they are generally used to describe your post in more detail.
>
> [https://en.support.wordpress.com/posts/categories-vs-tags/](https://en.support.wordpress.com/posts/categories-vs-tags/)

Regardless of the exact meaning, understanding which tags on your site are most popular can help you make decisions about what type of content to publish. This post outlines a strategy for identifying your most popular tags in Google Analytics

### Recording Arbitrary Data in Google Analytics

Google Analytics provides several mean for storing arbitrary data. The options available to us are as follows...

- [Content Groups](https://support.google.com/analytics/answer/2853423?hl=en)
- [Custom Dimensions](https://support.google.com/analytics/answer/2709828?hl=en)
- [Events](https://developers.google.com/analytics/devguides/collection/analyticsjs/events)

A critical concern for our implementation is that a single post can have many tags. This immediately disqualifies Content Groups as an option...

> If you call the same index number multiple times on the same page, then only the last call for that index number is sent to Analytics.
> 
> [Create/edit Content Groups](https://support.google.com/analytics/answer/2853546?hl=en) - Google Analytics Help

Next up is Custom Dimensions. The only way to send multiple values is by using a [Product-level scoped custom dimension](https://support.google.com/analytics/answer/2709828?hl=en#example-product). Doing this requires the site to be using enhanced ecommerce, and would require thinking of each tag as a product. This feels a bit dirty. [This Stack Overflow post](https://stackoverflow.com/a/21108458/2877224) suggests URL encoding the tags as a value, but we want them each stored uniquely, so this isn't really a workable solution.

This leaves us with Events, which is what we'll use

### Updating the analytics.js Tracker

Sending the data to Google Analytics is really easy. Below is the snippet I'm using on this site.

{% raw %}
```javascript
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', '{{ ga }}', 'auto');

  ga('send', 'pageview');

  {% if page.tags.size > 0 %}
  {% for tag in page.tags %}
    ga('send', 'event', 'taggedPost', 'view', '{{ tag }}');
  {% endfor %}
  {% endif %}

</script>
```
{% endraw %}

### The Result

You'll now be able to see which tags users are viewing under Behavior > Events > Overview.

<img
  class="rounded shadow"
  src="/img/blog/tracking-blog-tags/events-on-my-blog@1x.jpg"
  srcset="/img/blog/tracking-blog-tags/events-on-my-blog@1x.jpg 1x, /img/blog/tracking-blog-tags/events-on-my-blog@2x.jpg 2x"
  alt="A demonstration of tracking tags in Google Analytics from this blog">
  
  As you can see, [Magento](/tags/#magento) and [Security](/tags/#security) are the most popular tags on this site.