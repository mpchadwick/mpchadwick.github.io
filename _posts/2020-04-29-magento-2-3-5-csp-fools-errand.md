---
layout: blog-single
title: "Magento 2.3.5 + Content Security Policy (CSP): A Fool's Errand"
date: April 29, 2020
image: /img/blog/magento-2-3-5-csp/magento-miscellaneous-html@2x.png
tags: [Magento, Security]
has_tweet: true
related_posts:
- "On Magento Module Vulnerabilities"
- "Thinking About the Next&nbsp;Shoplift"
- "WTF Happened to Custom Layout Updates in Magento v2.3.4"
---

On April 28, 2020 Magento 2.3.5 was announced. It included an exciting new security enhancement, implementation of a [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP), available for both Magento Commerce and Magento Open Source.

> This release includes a set of powerful new security tools for Magento installations. Content Security Policies (CSP) provide additional layers of defense by helping to detect and mitigate Cross-Site Scripting (XSS) and related data injection attacks.
> 
> [Magento Open Source 2.3.5 Release Notes](https://devdocs.magento.com/guides/v2.3/release-notes/release-notes-2-3-5-open-source.html)

While this sounds great in theory, in practice, as things stand in Magento 2.3.5, Content Security Policy offers little to no value. In this post we'll take a look a why.

<!-- excerpt_separator -->

### Taking A Step Back - The Threat Model

Currently the biggest security concern facing Magento merchants is what's known as ["Magecart"](https://www.riskiq.com/what-is-magecart/).

Essentially, hackers embed malicious JavaScript into the page which scrapes customer information and sends it to malicious third party servers. Typically the JavaScript is designed to run on the checkout page and steal customer's credit card information and additional details which would be required to use that card such as billing address.

Hackers commonly do this by gaining access to their target's Magento admin panel, such as through a weak or stolen credential. They then take advantage of the Miscellaneous HTML feature of Magento (intended to allow administrators to add benign tags) to inject their malicious payload.

<img
  class="rounded shadow"
  src="/img/blog/magento-2-3-5-csp/magento-miscellaneous-html@1x.png"
  srcset="/img/blog/magento-2-3-5-csp/magento-miscellaneous-html@1x.png 1x, /img/blog/magento-2-3-5-csp/magento-miscellaneous-html@2x.png 2x"
  alt="Screenshot showing Miscellaneous HTML in Magento">

Given this threat model, Content Security Policy on the surface seems like the perfect solution...a whitelist of allowed scripts which can prevent these malicious scripts from running.

### The Reality of JavaScript in Magento

While Content Security Policy sounds like a great solution, Magento's frontend JavaScript stack prevents CSP from being implemented securely. There are a number of major hurdles Magento will need to overcome in order for Content Security Policy to even be in the discussion, given the threat model presented. Let's examine them.

#### Inline JavaScript

Magento 2.3.5 contains extensive inline JavaScript throughout the entire application. For this reason, Magento must allow `unsafe-inline`. This alone is pretty much game over given the previously outlined threat model as all the attacker needs to do is use an inline `<script>` tag.

However, even if Magento is able to remove all inline script from the codebase there's still a long journey before we can feel safe with our CSP. Let's look at some more issues...

#### Unsafe Eval

In addition to inline scripts, Magento currently requires specifying `unsafe-eval` to operate. Magento's CSP architecture design document explains this a bit:

> There is no way to disable unsafe-eval right now since we use it for UI components and some of the front-end libraries we employ need it (like jQuery). A strategy must be created to remove eval() usage from UI components.
> 
> [Magento's CSP Architectural Design Document](https://github.com/magento/architecture/blob/4c7e6731aa6de2728b7c5a53651399aba53ef9ff/design-documents/csp.md#default-csp)

The document makes no mention of KnockoutJS which essentially will need to be [ripped out to work with CSP](https://github.com/knockout/knockout/issues/903).

Note that addressing unsafe eval is equally important as addressing unsafe inline because an attacker can execute scripts by injecting HTML which Knockout will execute as JavaScript such as in the following example.

```html
<div data-bind="value: alert(1)"></div>
```

#### Lack of strict-dynamic support

Currently, Magento's Content Security Policy uses a whitelist approach. It ships with a list of domains that must be whitelisted for core functionality to work, and offers an extensible framework for developers to whitelist additional domains. 

The problem is, back in 2016 Google found that [95% of whitelist based CSPs can be trivially bypassed](https://websec.be/blog/cspstrictdynamic/). One of the most common reasons for this is that whitelisted domains contain JSONP endpoints that can be abused to bypass the CSP.

Here's an example of how whitelisting the required domains to embed Twitter tweets allows attackers to bypass your CSP:

```html
<script src="https://platform.twitter.com/widgets.js"></script>
<script src="https://cdn.syndication.twimg.com/timeline/profile?callback=__twttr/window.alert&screen_name=shinkbr"></script>
```

Credit: [https://gist.github.com/shinkbr/8af416589bb6abdb10ef7220bdca8260](https://gist.github.com/shinkbr/8af416589bb6abdb10ef7220bdca8260)

Google's [CSP Evaluator tool](https://csp-evaluator.withgoogle.com/) helps with identifying known dangerous hosts. The CSP on [Magento Marketplace](https://marketplace.magento.com/) (which runs Magento 2.3.5) currently whitelists 4 separate domains that contain flagged JSONP endpoints.

Google essentially concluded their research that whitelist based CSP is "infeasible in practice" and recommend an alternate approach called `strict-dynamic`, which involves adding a nonce or hash to each script tag, and whitelisting those in the CSP. `strict-dynamic` will then propagate trust to additional scripts that are loaded by these scripts.

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: <code>strict-dynamic</code> is not a panacea. There are many known bypasses including <a href="https://2017.appsec.eu/presos/Hacker/Don%E2%80%99t%20trust%20the%20DOM%20Bypassing%20XSS%20mitigations%20via%20Script%20gadgets%20-%20Sebastian%20Lekies,%20Krzystof%20Kotowicz%20and%20Eduardo%20Vela%20Nava%20-%20OWASP_AppSec-Eu_2017.pdf">bypasses abusing KnockoutJS</a></p>
</div>

Magento's architecture document states they plan to support `strict-dynamic` in the future, but as of 2.3.5 it is not an option.

### But CSP Can Block Exfiltration, Right?

Most Magecart payloads exfiltrate data by sending an AJAX request to the 3rd party server, and occasionally use an image tag, so you may be thinking that even if you can't stop scripting you can keep yourself safe by preventing exfiltration via the `connect-src` and `img-src` directives. Unfortunately, that's not true.

[Sebastian Lekies](https://twitter.com/slekies) can school you about this on Twitter:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">CSP will not prevent or mitigate this attack and it should not be advertised this way.</p>&mdash; Sebastian Lekies (@slekies) <a href="https://twitter.com/slekies/status/949905277796700160?ref_src=twsrc%5Etfw">January 7, 2018</a></blockquote>

Ultimately, there's a long list of ways to exfiltrate data from the page that are not subject to CSP, and it should be considered as a means for blocking scripting, not exfiltration.

### Then What Can I Do?

There are a number of things I would recommend a merchant begin to do before considering Content Security Policy. Let's go back to the original threat model. Typically it involves a malicious code being injected into Miscellaneous HTML. A good first step would be to regularly review the contents of this field for changes. Make a snapshot of the contents and store it in a separate location. At some regular schedule check Magento to see if it's changed. If it has, check whether it was authorized (e.g. marketing team updated something) or malicious. Assuming it was authorized, update your snapshot and check against that.

As a next step, you can consider doing the same with your CMS content, particularly if you inject a CMS block into checkout page. This could be a lot of content, so you probably don't want to do this manually. My [MwscanUtils2](https://github.com/mpchadwick/Mpchadwick_MwscanUtils2) module may help you.

You can also consider doing this with Google Tag Manager, which has the potential to also be abused for Magecart.

If you're doing all these things and you still want to take things to the next level Content Security Policy could be an option for you at some point. As of Magento 2.3.5, it's not a good option though. And even if all the issues called out above are resolved in Magento core, keep in mind it will likely be a big investment to integrate it into your website, will be difficult to get right, will be expensive to maintain, and in the end should not be perceived as offering a guarantee of any sort.