---
layout: blog-single
title:  "On Magento Module Vulnerabilities"
description: "A rant on the subject of vulnerabilities in Magento modules"
date: February 07, 2019
image:
tags: [Magento, Thoughts]
---

The topic of Magento module security has been heating up. Here are just a few things that have happened recently:

- [Willem de Groot](https://twitter.com/gwillem), the leading researcher tracking malware infections amongst the global Magento install base [reported](https://gwillem.gitlab.io/2019/01/29/magento-module-blacklist/) that Magento modules are now the main source of security breaches for Magento sites.
- In collaboration with several security-minded individuals (myself included) Willem also published, [magevulndb](https://github.com/gwillem/magevulndb), a repository tracking vulnerabilities in commonly used Magento modules.
- The topic of Magento module security is [slated for discussion](https://twitter.com/ext_dn/status/1093610566738894848?s=20) at the DevExchange at the upcoming [Magento Live AU](https://live-au.magento.com/) conference. The effort is being spearheaded by [ExtDN](https://extdn.org/)

I have some strong thoughts on the matter which I haven't been shy about sharing in the past...

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">So I think a requirement that <a href="https://twitter.com/ext_dn?ref_src=twsrc%5Etfw">@ext_dn</a> should impose is around proper disclosure of vulnerabilities in modules.</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/1067241826933985280?ref_src=twsrc%5Etfw">November 27, 2018</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Here, I want to express them in long form.

<!-- excerpt_separator -->

### On Software Vulnerabilities (in general)

Code vulnerabilities are an unfortunate, but inevitable reality of software development. One needs look no further than [the recent Facetime bug](https://9to5mac.com/2019/01/28/facetime-bug-hear-audio/) to realize that no matter how big a company, and how sophisticated its testing procedures, it is impossible to produce code that is free of them

Therefore, **the fact that a vendor ships code that contains vulnerabilities should NOT create a negative perception about that vendor**. Instead, what is critical in assessing the quality of a vendor is *how* that vendor responds when vulnerabilities are identified in their code

### What NOT To Do

The *worst* thing a vendor can do when they become aware of a vulnerability is to attempt to hide it from public knowledge. Doing so makes it more likely that customers will continue to run the vulnerable code, increasing the odds of being breached.

Instead, the vendor should transparently publicly disclose the existence of the vulnerability, ensuring that customers are aware and are able to patch.

### Specifically, What Should Magento Module Provider Do?

The Magento ecosystem is an interesting one. A module may have been purchased and installed on a Magento site by a company that no longer supports that site. It also may have been purchased by a non-technical individual working at the merchant who is not able to accurately assess the severity of the issue. As such private disclosures such as emails to customers on file who have purchased the module are not enough. Instead, providers should attempt to disclose vulnerabilities in a way that will reach the entire community who is potentially impacted by the issue.

The Magento community tends to be heavily active on Twitter, so I'd suggest that Magento module providers share the information there, including a link to an article on their website with additional information about the vulnerability.

### What Information Should The Module Provider Include When Disclosing A Vulnerability?

Another good question. It's not always easy to correlate a module advertised on a vendor's website back to its usage in the Magento codebase. As such I'd recommend that vendors always include instructions for customers  to check if they're impacted. For example:

> "Check your composer.lock file for acme/foobar. If you have a version older than 2.9.1 you are impacted".

Also, I'd suggest providing some details to assist in assessing the severity of the vulnerability. Magento publishes CVSSv3 scores for each vulnerability it patches. You could try these, but more importantly, the following questions should be answered:

- What type of vulnerability is it? (SQL injection? Remote code execution? XSS?)
- What privileges are required to exploit it? (Does the attacker need admin access or can they do it from the frontend?)
- Is it actively being exploited in the wild?
- Are there specific configurations required to exploit it? (For example, does it only work against nginx?  Does it require a misconfigured htaccess file?)

Additionally, for highly critical issues (especially unauthenticated RCE / SQL injection) I'd suggest publishing an immediate mitigation patch that doesn't require going through support to obtain.

### The Problem With All This

The problem with this all is that despite the fact that I've said people shouldn't have negative perceptions about code vulnerabilities, they do. As such there's a clear incentive for module providers to attempt to hide or downplay vulnerabilities. Unfortunately, as mentioned, this has a negative impact on customers. As such, in parting, I leave the following message:

- **If you are a customer (agency / merchant):** Do NOT let the presence of vulnerabilities in vendor modules create a negative perception of those vendors. Instead, judge vendors based on how they respond when vulnerabilities are identified.
- **If you are a module vendor:** Be transparent and open about vulnerabilities in your modules. I understand why you would want to minimize their publicity, but you are actively harming your customers by doing so.

And finally, if you are a journalist, stop with the harmful sensationalization of software vulnerabilities. This only helps feed this awful, harmful cycle.