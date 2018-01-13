---
layout: blog-single
title: Scalability Driven Development
description: In this post I discuss how to approach a problem with from an SDD (Scalability Driven Development) mindset.
date: September 21, 2016
tags: [Thoughts, Scaling]
---

As software developers in the present day, we hear about all different kinds of approaches to writing code which end in "DD". You've got [TDD](https://en.wikipedia.org/wiki/Test-driven_development), [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development), [DDD](https://en.wikipedia.org/wiki/Domain-driven_design), [FDD](https://en.wikipedia.org/wiki/Feature-driven_development), [ATDD](https://en.wikipedia.org/wiki/Acceptance_test%E2%80%93driven_development) and probably more. While each of these philosophies has merits of it's own, in this article, I want to outline yet another approach for writing code that ends in DD which I'm dubbing SDD (Scalability Driven Development).

SDD is a mindset that should be used while working out the implementation details for a given problem. Simply put, as you think through a specific approach ask yourself...

![Image of lady sitting in meeting asking "Will this scale?"](/img/blog/sdd/will-this-scale.png)

The image above is used ironically in a post titled [10 Tricks To Appear Smart In Meetings](http://thecooperreview.com/10-tricks-appear-smart-meetings/), but as a developer, it really is a good question to be asking.

SDD and doesn't prevent you from using TDD, BDD or any other approach you currently employ when writing code.

Let's take a look at real life example and demonstrate how an SDD mindset can be utilized to implement a more resilient solution to a given problem.

<!-- excerpt_separator -->

### The Feature Request

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This example is this post is based off implementing a feature in Magento 1 Enterprise Edition, but the overall subject of the post is relevant regardless of what platform you're using.</p>
</div>

The feature request in this case was pretty simple. The client wanted to be able to use a URL in marketing materials that, when accessed, would automatically apply a coupon code on behalf of the user. That's it.

### The Logical Place to Start

The logical place to start with this problem is to see how the application handles coupons out-of-the-box. In Magento that would be the `couponPostAction()` method in `Mage_Checkout_CartController`. A stripped down version of that method looks like this...

```php?start_inline=1
public function couponPostAction()
{
    $couponCode = (string) $this->getRequest()->getParam('coupon_code');

    $this->_getQuote()->setCouponCode($couponCode)
        ->collectTotals()
        ->save();

    $this->_goBack();
}
```

Looking at this, one initial thought might be to write a new controller action similar to `couponPostAction` to handle a coupon code in a query string and apply it to the quote, and then forward the user to another page. In fact if you [Google "magento coupon code url"](https://www.google.com/#q=magento+coupon+code+url) you'll find multiple guides online that outline that exact approach.

### How Will The Feature Be Used?

As mentioned, this feature was requested by someone working in marketing deparment. Why does that matter? Well, one of the goals of the people working in marketing is to drive traffic to the site (to increase sales). That means,  there's a pretty high chance a highly promotional email could go out, driving a surge of traffic to this controller action.

### The most important thing for scalability (in Magento at least)

In Magento 1 Enterprise Edition, the most important thing to do to ensure availability during a traffic surge is to ensure that the application is serving responses from cache as often as possible. [This is surely the case outside of the Magento space as well](http://highscalability.com/blog/2011/2/28/a-practical-guide-to-varnish-why-varnish-matters.html). With Magento 1 Enterprise Edition, page cache hits will...

- Use significantly less memory
- Require significantly less processing
- Close connections much quicker
- Not make a connection to MySQL
- Not start a session
- Not load the modules cache

All these things add up to the site being being able to service a much higher number of users.

### The problem with the controller

The problem with the controller approach is that under a surge, all traffic will be hitting an uncached route. Caching the controller response is simply impossible because the nature of a page cache response is to serve static HTML. Let's put on our SDD hat and try to arrive at a better solution.

### Queue the work for later

A better approach to this problem is to not actually apply the coupon to the user's quote / session through a controller, but to set a cookie on the user if a certain query parameter is found. This way, all users can hit a cached route, and we can simply put some JavaScript on the page to cookie the user. 

Then, we can wait until the user actually visits the cart and apply the coupon in a controller pre-dispatch observer. The ensures that...

- All the traffic is initially hitting a cached route
- If the user drops off without getting to the cart (this will happen a lot), no additional work was needed

### Conclusion

I hope some of you found this post informative and will keep it in mind as you're planning implementations for new features. The worst thing that can happen is to launch a bright shiny new feature, and then the first time it's actually used in production have the site go down. As always, feel free to leave any thoughts in the comments below or reach out to me on [Twitter](http://twitter.com/maxpchadwick).
