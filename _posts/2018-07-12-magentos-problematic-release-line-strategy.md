---
layout: blog-single
title:  "Magento's Problematic (lack of) Release Line Strategy"
description: My take on Magento's release line management strategy based on my experience as a contributor.
date: July 12, 2018
image: 
tags: [Magento]
---

Magento currently maintains and accepts pull requests to 3 separate branches on GitHub.

1. `2.1-develop` - Code targeting this branch will go into a 2.1.X release
2. `2.2-develop` - Code targeting this branch will go into a 2.2.X release
3. `2.3-develop` - Code targeting this branch will go into a 2.3.X release 

While the notion of allowing the community to contribute to each release line sounds good on paper, in practice it doesn't work out so well in my experience. 

In this post I'll outline the issues with this process as I see them.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><b>NOTE:</b> This post is not intended as an attack on the community engineering team or any of the maintainers who are doing a great job fielding managing community contributions. Instead, this is overall criticism of Magento's approach on a whole to managing it's release lines.</p>
</div>

### The Implied "Correct" Way To Contribute

As far as I can tell, the most "correct" way to contribute a fix or enhancement to Magento core is by porting it to each applicable branch. My colleague [Todd Christensen](https://github.com/toddbc) is a model citizen in doing so as can be seen in these three pull requests...

<img
  class="rounded shadow"
  src="/img/blog/magento-release-line-strategy/the-correct-way@1x.jpg"
  srcset="/img/blog/magento-release-line-strategy/the-correct-way@1x.jpg 1x, /img/blog/magento-release-line-strategy/the-correct-way@2x.jpg 2x"
  alt="The correct way to contribute">

[https://github.com/magento/magento2/pulls?utf8=%E2%9C%93&q=is%3Apr+is%3Aclosed+%22never+delete+all+changelog+rows%22](https://github.com/magento/magento2/pulls?utf8=%E2%9C%93&q=is%3Apr+is%3Aclosed+%22never+delete+all+changelog+rows%22)

This would seem to be the "correct" way of contributing as it ensures the code will make it into each applicable Magento release lines.

### The Issues With This Approach

There are a few problems with this strategy...

#### 1. Additional overhead as a contributor

In order to follow this process, as a contributor this means...

1. You need to have a development environment for EACH Magento release line
2. You need to test your changes (including running the expensive, time consuming test suite) on EACH Magento release line

This sums up to a very significant increase in the amount of time it takes to contribute to Magento. 

Personally, as a contributor, I'd rather not have to put in all this additional extra effort if I don't even know if my change is something that will be accepted by Magento.

#### 2. This strategy isn't documented

I'm making an assumption here that PR-ing your changes to each of the release lines is the most "correct" way to contribute, however nowhere is that process officially documented. [Magento's contribution documentation](https://devdocs.magento.com/guides/v2.0/contributor-guide/contributing.html)  simply states that PRs can be issued to any of those branches. As such, only savvy contributors are likely to be aware of this process.

#### 3. This strategy isn't enforced

As you'd assume, since this strategy isn't documented neither is it enforced. This can cause a multitude of issues. Case in point, in [pull request #12935](https://github.com/magento/magento2/pull/12935) I added an enhancement to the `Magento_NewRelicReporting` module in `2.2-develop`. It was merged, with no evident plan for getting the same changes into `2.3-develop` (in other words a **newer** version of Magento was lacking a feature that was already available in an **older** version).

As a good samaritan I took it upon myself to [forwardport](https://github.com/magento/magento2/compare/2.3-develop...mpchadwick:feature/2.3/new-relic-separate-areas?expand=1) the changes to `2.3-develop` at which point I saw that one of the community maintainers, [Ihor Sviziev](https://github.com/ihor-sviziev), [had already taken it upon himself to do the same](https://github.com/magento/magento2/pull/15947). However, despite contributing literally the exact code as me, which had already been merged to `2.2-develop`, his pull request received extensive scrutiny during code review with many requests for changes. As such, the implementation specifics will diverge across release lines, making it more challenging to automatically and easily port changes to the `Magento_NewRelicReporting` module across branches.

### What Are You Suggesting?

Stability and consistency across its release lines should be Magento's problem to solve, not the community's. It is in fact in their best interests to have a product that is stable and consistent across versions. Imagine the following scenario...

- Client is on Magento 2.1 and experiences CRITICAL bug to impacting a somewhat abstract Magento feature that is crucial to client's business.
- That client's SI fixes the bug an contributes fix back to Magento 2.1-develop (version client is currently on)
- Client later upgrades Magento to 2.2
- Fix had never been ported to Magento 2.2. CRITICAL BUG is reintroduced.

As you could imagine, the client probably has a pretty bad taste for Magento at this point.

As such I think the most sane thing for Magento to do is to have contributors contribute to a single development branch. Release managers at Magento should then be responsible for porting fixes and features into release lines. 
