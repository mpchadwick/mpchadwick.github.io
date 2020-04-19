---
layout: blog-single
title:  Working With The Magento 2 Page Cache The Right Way
description: Developing for an environment with full page caching is tough. Here I provide optimal solutions for some common problems.
date: October 23, 2017
image:
tags: [Magento]
has_tweet: true
---

<div class="tout tout--secondary">
<p><strong>WARNING</strong>: This article is highly critical of some blog posts, Stack Exchange answers, and GitHub issue comments. This is not a personal attack on the authors of those posts or answers. Instead, the intent is to call out the issues with some information that is floating around and provide alternate solutions to mitigate the risk of many users adopting practices that are harmful to the usage of the page cache in Magento 2.</p>
</div>

Recently I wrote a post titled ["How Magento 2 Decides If A Page Is Cacheable"]({{ site.baseurl }}{% link _posts/2017-10-20-how-magento-2-decides-if-a-page-is-cacheable.md %}). After I posted it on Twitter I got a response about the depersonalizer

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">... And don&#39;t forget about the depersonaliser: <a href="https://t.co/nqile0R5ny">https://t.co/nqile0R5ny</a></p>&mdash; Giel Berkers (@kanduvisla) <a href="https://twitter.com/kanduvisla/status/921982698394214400?ref_src=twsrc%5Etfw">October 22, 2017</a></blockquote>

I read through the article and felt a twinge of horror when I read this line...

> BEWARE OF WHAT YOU ARE DOING HERE! Because basically you are disabling full-page cache entirely for every logged in customer

The author of the article was providing a "solution" that involved breaking full page cache for any logged in user.

I started doing some more research about what the author was writing about and over the course of that, learned that there is **a lot** of bad information floating around the internet about working with the Magento 2 page cache.

In this post, I'd like to help offer some best practices...

<!-- excerpt_separator -->

### Accessing The The Customer Logged In State After Depersonalization Happens

In [the article from the Tweet](https://giel.berkers.online/articles/magento/customer-sessions-depersonalizer) the author needed to access the customer's logged in state after depersonalization happened. Because the session is not available at that point, the author suggested disabling depersonalization when logged in, which would break page cache for logged in users. **This presents a serious performance and scalability concern and is not a good solution**. 

In order to understand how to access this information let's look at `Magento\Customer\Block\Account\Customer`, the block responsible for rendering the accounts links in the header for logged in users. In the `customerLoggedIn` method we see the following code...

```php?start_inline=1
public function customerLoggedIn()
{
    return (bool)$this->httpContext->getValue(\Magento\Customer\Model\Context::CONTEXT_AUTH);
}
```

As you can see it consults the `$httpContext` to make the determination as to whether or not the customer is logged in, not the session. This allows us to query the customers logged in state with no impact on the page cache, and is the correct way to solve this problem.

### Accessing The Customer Id From A Block When Full Page Cache Is Enabled

While poking around I also stumbled upon an article titled ["How to get the customer id from block when full page cache enable in magento 2"](https://ranasohel.me/2017/05/05/how-to-get-customer-id-from-block-when-full-page-cache-enable-in-magento-2/). The article starts out good, advising the reader to **not** use `cacheable=false`, but takes a turn for the worst when it suggests adding the customer ID to the HTTP context. To explain why this is a bad idea, I'll include a snippet from Magento's DevDocs...

> Context variables should not be specific to individual users because variables are used in cache keys for public content. In other words, a context variable per user results in a separate copy of content cached on the server for each user.
> 
> [Magento DevDocs - Full page caching - Public content](http://devdocs.magento.com/guides/v2.2/extension-dev-guide/cache/page-caching/public-content.html)

By putting the customer ID in the HTTP context, you've done more or less the same thing as the previous example. Now there is a unique cache entry for any given page for every logged in user. So the page cache is more or less borked if you're logged in.

To display content that is unique to the user you should be using Knockout placeholders as described in [Magento's "Private Content" DevDocs article](http://devdocs.magento.com/guides/v2.2/extension-dev-guide/cache/page-caching/private-content.html). Here's how Magento handles the welcome message which shows in the global header, for example...

```html
<span data-bind="text: customer().fullname"></span>
```

### cacheable=false

The most prevalent and harmful misinformation on full page caching is around the usage of the `cacheable=false` XML attribute. 

![](/img/cacheable-false.jpg)

Including this attribute on a block will make any page that uses that block uncacheble. Unfortunately, there's a lot of misinformation floating around and many cases where developers are using this to "solve" their problem, but actually breaking FPC.

For example, in [a question titled "How to check if a customer is logged in or not in magento 2?"](https://magento.stackexchange.com/questions/91897/how-to-check-if-customer-is-logged-in-or-not-in-magento-2). I found the following exchange...

> User A: It is a good solution. Though you can use cachable="false" in layout file.
> 
> User B: I have `cachable="false"` in layout XML for this block, but varnish is still caching it apparently.
 
As already discussed, you can check if the user is logged in by consulting the HTTP context.

Unfortunately, the recommendations for the usage of `cacheable="false"` turn up every where you look.

There are multiple users advocating it's usage in [the GitHub issue "Cannot get customer session data"](https://github.com/magento/magento2/issues/3294#issuecomment-260520379), for example. You only need to[ search twitter for "cacheable=false"](https://twitter.com/search?q=cacheable%3Dfalse) to see how big of an issue it is.

### Conclusion

Here I've covered a few of the issues I've seen with usage of the full page cache in Magento 2. Hopefully this article will help some understand how Magento handles caching better, and help everyone get the most out of the full page cache on their Magento 2 sites.
