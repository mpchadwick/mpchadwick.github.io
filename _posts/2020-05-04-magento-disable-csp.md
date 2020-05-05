---
layout: blog-single
title: "Disable Content Security Policy (CSP) in Magento"
date: May 4, 2020
image: 
tags: [Magento, Security]
related_posts:
- "Magento 2.3.5 + Content Security Policy (CSP): A Fool's Errand"
- "On Magento Module Vulnerabilities"
- "WTF Happened to Custom Layout Updates in Magento v2.3.4"
---

As of version 2.3.5, Magento implements a Content Security Policy (CSP), which is enabled by default in report only mode. In a previous post, I outlined some [concerns about the usefulness of Content Security Policy in Magento 2.3.5]({{ site.baseurl }}{% link _posts/2020-04-29-magento-2-3-5-csp-fools-errand.md %}). Here we'll take a look at how to disable Content Security Policy.

<!-- excerpt_separator -->

### How To Disable Content Security Policy (CSP)

The best way to disable Content Security Policy is to disable the `Magento_Csp` module:

```
php bin/magento module:disable Magento_Csp
```

For security reasons, there is no on / off switch available from the Magento admin panel (otherwise a potential attacker with Magento admin access could avoid detection by disabling the module). As such it must be done from the command line.

### Why Would I Do This

As discussed in [Magento 2.3.5 + Content Security Policy (CSP): A Fool's Errand]({{ site.baseurl }}{% link _posts/2020-04-29-magento-2-3-5-csp-fools-errand.md %}) CSP offers little to no value for the threat model facing most Magento merchants. For the most part, it's currently just a source of noise in the developer console, which will only further contribute to [alarm fatigue](https://en.wikipedia.org/wiki/Alarm_fatigue).

An out-of-the-box Magento 2.3.5 Commerce Edition install displays all these errors in the console when loading the admin panel:

```
The Content Security Policy 'font-src 'self' 'unsafe-inline'; form-action secure.authorize.net test.authorize.net geostag.cardinalcommerce.com geo.cardinalcommerce.com 1eafstag.cardinalcommerce.com 1eaf.cardinalcommerce.com centinelapistag.cardinalcommerce.com centinelapi.cardinalcommerce.com 'self' 'unsafe-inline'; frame-ancestors 'self' 'unsafe-inline'; frame-src secure.authorize.net test.authorize.net geostag.cardinalcommerce.com geo.cardinalcommerce.com 1eafstag.cardinalcommerce.com 1eaf.cardinalcommerce.com centinelapistag.cardinalcommerce.com centinelapi.cardinalcommerce.com www.paypal.com www.sandbox.paypal.com 'self' 'unsafe-inline'; img-src widgets.magentocommerce.com www.googleadservices.com www.google-analytics.com t.paypal.com www.paypal.com www.paypalobjects.com fpdbs.paypal.com fpdbs.sandbox.paypal.com *.vimeocdn.com s.ytimg.com 'self' 'unsafe-inline'; script-src assets.adobedtm.com secure.authorize.net test.authorize.net geostag.cardinalcommerce.com 1eafstag.cardinalcommerce.com geoapi.cardinalcommerce.com 1eafapi.cardinalcommerce.com songbird.cardinalcommerce.com includestest.ccdc02.com js.authorize.net jstest.authorize.net www.googleadservices.com www.google-analytics.com www.paypal.com www.sandbox.paypal.com www.paypalobjects.com t.paypal.com js.braintreegateway.com s.ytimg.com video.google.com vimeo.com www.vimeo.com cdn-scripts.signifyd.com www.youtube.com 'self' 'unsafe-inline' 'unsafe-eval'; style-src getfirebug.com 'self' 'unsafe-inline'; object-src 'self' 'unsafe-inline'; media-src 'self' 'unsafe-inline'; manifest-src 'self' 'unsafe-inline'; connect-src geostag.cardinalcommerce.com geo.cardinalcommerce.com 1eafstag.cardinalcommerce.com 1eaf.cardinalcommerce.com centinelapistag.cardinalcommerce.com centinelapi.cardinalcommerce.com 'self' 'unsafe-inline'; child-src 'self' 'unsafe-inline'; default-src 'self' 'unsafe-inline' 'unsafe-eval'; base-uri 'self' 'unsafe-inline';' was delivered in report-only mode, but does not specify a 'report-uri'; the policy will have no effect. Please either add a 'report-uri' directive, or deliver the policy via the 'Content-Security-Policy' header.

(index):1 [Report Only] Refused to load the stylesheet 'https://fonts.googleapis.com/css?family=Work+Sans:400,700.less' because it violates the following Content Security Policy directive: "style-src getfirebug.com 'self' 'unsafe-inline'". Note that 'style-src-elem' was not explicitly set, so 'style-src' is used as a fallback.

(index):1 [Report Only] Refused to load the script 'https://www.google.com/recaptcha/api.js' because it violates the following Content Security Policy directive: "script-src assets.adobedtm.com secure.authorize.net test.authorize.net geostag.cardinalcommerce.com 1eafstag.cardinalcommerce.com geoapi.cardinalcommerce.com 1eafapi.cardinalcommerce.com songbird.cardinalcommerce.com includestest.ccdc02.com js.authorize.net jstest.authorize.net www.googleadservices.com www.google-analytics.com www.paypal.com www.sandbox.paypal.com www.paypalobjects.com t.paypal.com js.braintreegateway.com s.ytimg.com video.google.com vimeo.com www.vimeo.com cdn-scripts.signifyd.com www.youtube.com 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.

api.js:1 [Report Only] Refused to load the script 'https://www.gstatic.com/recaptcha/releases/wk6lx42JIeYmEAQSHndnyT8Q/recaptcha__en.js' because it violates the following Content Security Policy directive: "script-src assets.adobedtm.com secure.authorize.net test.authorize.net geostag.cardinalcommerce.com 1eafstag.cardinalcommerce.com geoapi.cardinalcommerce.com 1eafapi.cardinalcommerce.com songbird.cardinalcommerce.com includestest.ccdc02.com js.authorize.net jstest.authorize.net www.googleadservices.com www.google-analytics.com www.paypal.com www.sandbox.paypal.com www.paypalobjects.com t.paypal.com js.braintreegateway.com s.ytimg.com video.google.com vimeo.com www.vimeo.com cdn-scripts.signifyd.com www.youtube.com 'self' 'unsafe-inline' 'unsafe-eval'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.

(anonymous) @ api.js:1
(anonymous) @ api.js:1
6[Report Only] Refused to load the font '<URL>' because it violates the following Content Security Policy directive: "font-src 'self' 'unsafe-inline'".
```
{:.wrap}

Extensive confusion amongst developers caused by these errors can be see on StackExchange:

- [Magento 2.3.5 Content Security Policy false positive cdn fonts](https://magento.stackexchange.com/questions/311661/magento-2-3-5-content-security-policy-false-positive-cdn-fonts?rq=1)
- [Magento 2.3.5 Content Security Policy (CSP) data:image](https://magento.stackexchange.com/questions/311724/magento-2-3-5-content-security-policy-csp-dataimage?noredirect=1&lq=1)
- [Magento 2.3.5 Content Security Policy directive: "img-src](https://magento.stackexchange.com/questions/311788/magento-2-3-5-content-security-policy-directive-img-src)

As this point, the best course of action at the moment is simply to disable the module.
