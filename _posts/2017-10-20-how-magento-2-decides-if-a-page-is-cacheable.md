---
layout: blog-single
title:  How Magento 2 Decides If A Page Is Cacheable
description: A look at the checks that Magento runs to determine whether or not a response is cacheable.
date: October 20, 2017
image:
tags: [Magento]
---

A high page cache hit rate is one of the most important factors in having a performant Magento 2 site. Unfortunately, it's very easy to screw up.

<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">I can safely say I&#39;ve seen issues with cacheable=&quot;false&quot; in every store with <a href="https://twitter.com/hashtag/Varnish?src=hash&amp;ref_src=twsrc%5Etfw">#Varnish</a> I worked on, mostly in 3rd party extensions.<a href="https://twitter.com/hashtag/Magento2?src=hash&amp;ref_src=twsrc%5Etfw">#Magento2</a> <a href="https://t.co/cHoOuFOSlp">pic.twitter.com/cHoOuFOSlp</a></p>&mdash; Miguel Balparda (@mbalparda) <a href="https://twitter.com/mbalparda/status/897836632233181184?ref_src=twsrc%5Etfw">August 16, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

In this post I'll go into the Magento internals to demonstrate how Magento decides whether or not to cache a response. This is useful to know to help debug in cases where a site is not getting the most bang for buck out of the page cache.

<!-- excerpt_separator -->

### The Moment Of Truth

The decision on whether or not a Magento will instruct the caching backend to save the response is made in `Magento\PageCache\Model\Layout\LayoutPlugin::afterGenerateXml()`. Below I will paste the full method, including the DocBlock...

```php?start_inline=1
/**
 * Set appropriate Cache-Control headers
 * We have to set public headers in order to tell Varnish and Builtin app that page should be cached
 *
 * @param \Magento\Framework\View\Layout $subject
 * @param mixed $result
 * @return mixed
 */
public function afterGenerateXml(\Magento\Framework\View\Layout $subject, $result)
{
    if ($subject->isCacheable() && $this->config->isEnabled()) {
        $this->response->setPublicHeaders($this->config->getTtl());
    }
    return $result;
}
```

As you can see, after generating the final layout XML Magento will call the `isCacheable` method on the layout object, if this returns true and caching is enabled, it will set the appropriate response headers to instruct the caching backend to cache the response.

### Checking If The Response Is Cacheable

Next up, let's take a look at how Magento decides if the response is cacheable. This is defined in `Magento\Framework\View\Layout::isCacheable`...

```php?start_inline=1
/**
 * Check is exists non-cacheable layout elements
 *
 * @return bool
 */
public function isCacheable()
{
    $this->build();
    $cacheableXml = !(bool)count($this->getXml()->xpath('//' . Element::TYPE_BLOCK . '[@cacheable="false"]'));
    return $this->cacheable && $cacheableXml;
}
```

As you can see, after `build`-ing the layout XML, the method checks if the final resulting layout XML contains any blocks with the `cacheable` attribute set to false. If it finds any, **the entire response will not be cached**. 

This is where a lot of mistakes happen. Developers think that if their block contains private content the "solution" is to set the `cacheable` attribute to `false` in the layout XML. In truth, what they've done at this point, is not to prevent their block from being cached, but prevented the entire page from being cached for any page using their block. I've seen this in the category, product, or even default layout handles.

### Varnish's Say

After `Magento\PageCache\Model\Layout\LayoutPlugin` sniffs the response for `cacheable=false` blocks, Varnish gets the final say on whether or not the response will be cached. We can see in the VCL that there are some rules that will prevent the response from being cached.

```
# We only deal with GET and HEAD by default
if (req.method != "GET" && req.method != "HEAD") {
    return (pass);
}

# Bypass shopping cart, checkout and search requests
if (req.url ~ "/checkout" || req.url ~ "/catalogsearch") {
    return (pass);
}
``` 

### Saved To The Cache!

If the response passes Magento's `isCacheable` check and meets the requirements of the VCL it will make it to the cache.

Hopefully this is happening on your site as often as possible because...

**Performance = High Cache Hit Rate + Optimized Uncached Execution**


