---
layout: blog-single
title: "Should Magento Certification Exams Be \"Open Book?\""
description: In this post we take a look at community opinion on this question, and then I voice my own.
date: October 05, 2016
tags: [magento, thoughts]
---

I recently obtained [my first Magento certification](https://www.magentocommerce.com/certification/directory/dev/1629453/), passing the Certified Developer exam. I had taken the exam a year and a half prior and didn't pass. I'd been doing Magento development professionally for nearly 18 months at that point.

I spent a bunch of time studying this time around and one question stuck with me in the end...Should the certification exam be "open book"? I have my own opinions on the matter, but rather than sharing them, I decided to take a poll of the Magento Twitter community first to get the lay of the land.
 
Now, the results are in, let's take a look at what [the #realmagento community on Twitter](https://twitter.com/hashtag/realmagento) thinks. Then I'll lay out my own opinion on the matter.

<!-- excerpt_separator -->

### What the Community Thinks

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">POLL 🎙️ <a href="https://twitter.com/hashtag/Magento?src=hash">#Magento</a> <a href="https://twitter.com/hashtag/realmagento?src=hash">#realmagento</a> community... What access should be allowed when taking certification exam? Please vote / retweet / share</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/781101629567332352">September 28, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

As you can see,  with a little less than one third of the votes, "closed book" is the minority. 

Nearly 50% of those surveyed believed that access to the Magento source code while taking the test would be fair. Exactly 1 in 5 thought that testing candidates should additionally have access to Google while testing.

Worded diferently, the majority of those surveyed were opposed to the current "closed book" testing policy.

### What I Think

My opinion on the matter is as follows...The current closed book approach rewards rote memorization rather than reflecting the ability of an individual to solve an actual problem in Magento.

For example, if you take the Magento Certified Developer exam you'll find questions that look something like this...

> What is the correct path in the configuration tree at which product types are declared?
> 
> 1. `frontend/catalog/product/type`
> 2. `global/catalog/product/type`
> 3. `catalog/product/type`
> 4. `default/catalog/product/type`

Now, before studying for this exam, if you had asked me that off hand, I probably would've gotten answer wrong. Inspecting information about product types is not something that a Magento developer needs to do frequently on a day-to-day basis. However, if you gave me access to the Magento source code I'd inherently assume that this information was specified in the `config.xml` file of the `Mage_Catalog` module and could find the answer pretty quickly.

If you take as Magento certification exam you'll see that there are a lot of examples like this across many core modules which require memorization such as...

- Paths in the configuration tree
- Names of specific database tables
- Database schema information
- Names of specific classes
- Names of specific methods

This is all stuff I can find pretty quickly reviewing the Magento source code, but don't necessarily have memorized off hand.

So, I'm pretty emphatic about the fact that providing access to the Magento source code will lead to a more realistic assessment of an individuals ability to actually solve problems in Magento.

### What About Google?

This is a tough one. On the one hand, in the real world, Magento developers *will* have access to Google and it almost certainly the tool that they will *actually* be using most frequently to find out information.

However, in the context of a test, access to Google could encourage cheating. There are already a number of websites that go through each question from the Magento Certified Developer Study Guide and attempt to answer each question. If testing candidates have access to Google could this escalate to the point where individuals are actually able to find the exact answers to the questions on the test?

### Where I Land

In the end, I'm on the same page as the majority of voters that access to the Magento source code should be allowed, however providing access to Google is a bit too risky in the context of a test.

If you have any comments on this, have a different opinion and reasons why, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
