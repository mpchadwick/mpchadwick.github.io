---
layout: blog-single
title:  "Thinking About the Next&nbsp;Shoplift"
description: "Shoplift was a CVSSv3 Severity 9.1 RCE Magento vulnerability. That was back in 2015. What happens if we see another Shoplift-level vulnerability? That's the focus of this post"
date: December 14, 2018
image:
tags: [Magento, Thoughts]
---

On February 19, 2015 Magento dropped patch [SUPEE-5344](https://magento.com/security/patches/supee-5344-%E2%80%93-shoplift-bug-patch). The patch addressed APPSEC-921, a CVSSv3 Severity 9.1 Remote Code Execution vulnerability which later became known as ["Shoplift"](https://blog.checkpoint.com/2015/04/20/analyzing-magento-vulnerability/). The patch was dubbed "Shoplift" in response to [a video](https://www.youtube.com/watch?v=pnNWCLADBJc) published by [Check Point](https://www.checkpoint.com/) that showed how it could be used to zero out the price of products on a site and purchase them for free (in other words, steal them).

While this is a novel idea, the reality is that most attackers exploited the vulnerability to implant malware in the victim's environment, silently stealing their user's credit card information and sending it to a drop server under their control. They'd also upload backdoors to the victims server...hidden (to the amateur eye) entry points that they could use to re-enter and re-compromise the victim's site again in the future.

<!-- excerpt_separator -->

Flash forward to the current day. We see a steady stream of security patches coming out for both Magento 1 and Magento 2, typically every 3 months. These patches address critical issues such as authenticated remote code execution and XSS. However, we have not seen a vulnerability as significant as Shoplift in recent history.

That being said, given Magento's [ongoing](https://devdocs.magento.com/guides/v2.3/graphql/) [feature](https://github.com/magento-engcom/msi/wiki/MSI-Roadmap) [enhancement](https://github.com/magento-research/pwa-studio) as well as the [continuous discovery](https://blog.ripstech.com/2018/new-php-exploitation-technique/) of [new exploitation techniques](https://github.com/Bo0oM/PHP_imap_open_exploit) by security researchers it seems likely, or even inevitable, that a we'll see another vulnerability similar to Shoplift at some point in the future.

The goal of this post is to layout my thoughts on this matter. Specifically, I have strong opinions about how Magento should handle this scenario and I wanted to put them out in the open, so that they can be reviewed, critiqued and hopefully considered as part of a response to the next Shoplift scenario by Magento.

### Patch Files and Upgrades: The Current State of Affairs

Currently, Magento releases security updates for both Magento 1 and Magento 2. If you're running Magento 1 you have two options:

1. **Apply a Patch File** Magento publishes patch files ("SUPEE patches") for every version of Magento 1 that is still in support. This means that you can apply the patch and be safe from the vulnerability without upgrading the software. Historically this has been the main way of incurring security updates for Magento 1.
2. **Upgrade Magento** Alternately you can upgrade Magento to the latest version.

With Magento 2 your _only_ option is to upgrade.

### Patch Files vs. Upgrade: Pros and Cons

In my experience, while the Magento 2 upgrade-only approach was touted as simpler and cleaner, there is actually far more effort involved with a Magento 2 upgrade than there is with application of a Magento 1 patch file. The primary reason for this is that Magento does not limit the upgrades to **only** include security fixes. They also bundle in bug fixes (you know that meme where someone fixes one bug and then 3 more pop-up) and even feature enhancements.

Additionally, between security updates Magento publishes non-security releases which may or not be relevant to a merchant running the software. Merchants get fatigued with constant patching and upgrades and if the upgrade isn't security critical, why apply it?

(As you can see the issue is that applying it is your only path to getting the security fixes when they come out in the future. And you don't want to be blocked from quickly applying security fixes due to issues with the feature enhancement release that you haven't applied yet.)

### Doing The Math: What Does This Mean for the next Shoplift

There are a few key takeaways here that need to be considered with publication of a fix for the next Shoplift.

#### 1. The bigger the release package, the more likely it is to break things

IMHO a release which fixes a Shoplift-level vulnerability should ONLY include the fix for that vulnerability and nothing else. And by nothing else I don't mean strip out the bugfixes and enhancements. I don't think the release should include fixes for *any* other vulnerabilities (Magento security releases often patch over 20 distinct vulnerabilities), because those fixes are just as likely to cause issues with deployment. It should literally be a release which **ONLY** fixes the Shoplift level vulnerability.

#### 2. Many merchants likely won't be in a position to upgrade quickly when the release comes out

This goes back to the release fatigue I mentioned earlier. Lets say Magento publishes version 2.2.11 and it includes a patch for a Shoplift-level vulnerability. There will likely be merchants back at 2.2.9 or even further who can't easily go to 2.2.11 (even if the release makes it really easy to go from 2.2.10 to 2.2.11). For that reason, in this special scenario I think Magento should provide a patch file option that works for **EVERY** version of Magento that is officially under support.

### The Doomsday Scenario

Of course, so far, we've overlooked the **_true_** doomsday scenario.

Shoplift and the assumed "next Shoplift" in this post were disclosed responsibly to Magento through Magento's Bug Bounty Program. This allows Magento to properly prepare and coordinate release of the patch.

The _real_ doomsday scenario is that a full-disclosure of Shoplift-level vulnerability is made public without any prior notification to Magento (or with some notification, but not done responsibly).

This would be a really bad scenario. Here, my best advice is for Magento to take note of all the points I've outlined above and work around the clock to provide a solution to merchants as quick as humanly possible.
