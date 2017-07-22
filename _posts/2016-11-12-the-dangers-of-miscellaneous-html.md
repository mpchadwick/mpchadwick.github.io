---
layout: blog-single
title: "The Dangers of \"Miscellaneous HTML\""
description: A discussion on the dangers of globally rendering any content from a text area in the admin
date: November 12, 2016
tags: [Magento, Security]
---

Recently, I've been giving some thought to the risks associated with the "Miscellaneous HTML" and "Scripts and Style Sheets" (a.k.a. "Miscellaneous Scripts" in Magento 1) features in Magento. For those who don't know, these are two text fields that accept any arbitrary input which is then rendered globally in the footer or header (respectively).

<img
  src="/img/blog/dangers-of-miscellaneous-html/magento-2-miscellaneous-html_2@1x.jpg"
  srcset="/img/blog/dangers-of-miscellaneous-html/magento-2-miscellaneous-html_2@1x.jpg 1x, /img/blog/dangers-of-miscellaneous-html/magento-2-miscellaneous-html_2@2x.jpg 2x"
  alt="Magento 2's Miscellaneous HTML field">
  
This was mainly spurred by [Willem de Groot's findings on credit card skimming](http://gwillem.gitlab.io/2016/10/11/5900-online-stores-found-skimming/). These fields are [typically implicated in these types of exploits](https://productforums.google.com/forum/#!msg/webmasters/aCMWg2CkGuc/bojnf5bAMFkJ). I took Twitter to voice some initial thoughts on the matter.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/realmagento?src=hash">#realmagento</a> idea in light of research done by <a href="https://twitter.com/gwillem">@gwillem</a>. Content security policy, but for core config data rows.</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/789066489139716096">October 20, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

My Tweet there was just something that had popped into my head, but at this point, I've had more time to think on the matter and wanted to share my thoughts.

<!-- excerpt_separator -->

### On / Off Switch

First and foremost, I think that administrators should have the ability to turn this feature off entirely. There are tools that offer similar functionality such as [Google Tag Manager](https://www.google.com/analytics/tag-manager/) ("GTM"), which... 1) Is officially integrated into Enterprise Edition; 2) Has been integrated into both [Magento 1](https://github.com/CVM/Magento_GoogleTagManager) and [2](https://github.com/magepal/magento2-googletagmanager) via unofficial (free) community tools. 

GTM can function exactly like "Miscellaneous HTML" with very little effort, but also supports much more sophisticated use cases via the [Data Layer](https://developers.google.com/tag-manager/devguide). It also offers many advanced features which make it more secure including...

1. Fine grained control over user permissions
2. Versioned control with visibility into changes introduced in each version (and by who)
3. Ability to introduce approval workflows for any changes.

Luna Metrics published [a great post outlining the security features built into GTM](http://www.lunametrics.com/blog/2015/06/02/google-tag-manager-security-risks/).

Turning the feature off should...

1. Hide the fields in the admin so that no one attempts to use a defunct feature
2. Prevent any data that is stored in the database for these fields from being rendered

Since most Magento power users are accustomed to having this feature available, it should default to "on", but official Magento security resources should state that turning it off removes a potential attack vector.

### Responsibly Allowing "Miscellaneous HTML" in Magento

For stores that, for whatever reason, want to keep the feature on, Magento should build in some additional security related features. In my mind, the main thing needed is the ability to monitor and audit changes to these fields.

Similar to functionality offered by GTM, Magento should maintain a log of changes to both of these fields. In addition to hooking in to save events in the Magento admin, MySQL `TRIGGER`s should be used to detect any changes that might result from SQL injection. Changes to the data detected by the `TRIGERR`s without corresponding changes stemming from admin actions should set off alarms.

There should be an area in the admin where these changes can be audited showing before and after for each. Another thing that could be added is a daily cron job which sends a digest of any changes to a configured email address (e.g. an individual in charge of security for the store is notified of all changes).

### Regarding Content Security Policies

One other topic I've been thinking about in all this is [content security policies](https://developer.mozilla.org/en-US/docs/Web/Security/CSP). For those who don't know, the Content Security Specification allows the server to send back a response header (`Content-Security-Policy`) which outlines from which origins scripts can be executed from (and whether or not inline script is permitted). [It is supported in all modern browsers other than Opera Mini](http://caniuse.com/#feat=contentsecuritypolicy).

Implementing a content security policy can additionally help mitigate the dangers of accepting "Miscellaneous HTML" (or even using Google Tag Manager, if an admin user's Google account were to get hacked). It would be interesting to see Magento pursue introducing the ability to utilize a Content Security Policy. 

### Conclusion

If you have any comments, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
