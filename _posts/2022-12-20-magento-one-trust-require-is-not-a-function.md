---
layout: blog-single
title:  "Magento + OneTrust Coookie Consent - require is not a function"
date: December 20, 2022
image: 
tags: [Magento]
related_posts:
---

There's a lot to be said about implementing OneTrust Cookie Consent and this post doesn't intend to cover it all. Instead, I'd like to share my experience with the JavaScript errors that occured when adding the OneTrust Cookie Consent scripts to a production Magento instance. Here's a screenshot of the errors from the developer tools:

<img
  class="rounded shadow"
  src="/img/blog/magento-onetrust-require-is-not-a-function/require-is-not-a-function-dev-tools@1x.png"
  srcset="/img/blog/magento-onetrust-require-is-not-a-function/require-is-not-a-function-dev-tools@1x.png 1x, /img/blog/magento-onetrust-require-is-not-a-function/require-is-not-a-function-dev-tools@2x.png 2x"
  alt="Screenshot of errors present in a developer tools">

<!-- excerpt_separator -->

These errors caused most JavaScript reliant functionality (e.g. add to cart / apply product filters) to break.

In order to resolve this issue I spent quite a bit of time troubleshooting obfuscated code, coordinating with OneTrust support, and reading through OneTrust documentation. In this post I hope to save you some of that time if you're dealing with the same error.

### Background: OneTrust Auto-Blocking

If you're dealing with this error on a Magento site, like me, there's a good change you're using [OneTrust Auto-Block](https://my.onetrust.com/articles/en_US/Knowledge/UUID-c5122557-2070-65cb-2612-f2752c0cc4aa). Using the Auto-Blocking technology makes a lot of sense because without it, there's a non-trivial engineering lift to ensure that cookies are actually blocked (see: [OneTrust: Cookie Blocking - Blocking Cookies via Tag Managers and HTML Implementation Webinar](https://community.cookiepro.com/s/article/Cookie-Blocking-Blocking-cookies-via-Tag-Managers-and-HTML?language=en_US)). Using auto-block in theory simplifies this as we can just have OneTrust automatically block scripts without needing to change anything within the website markup or tag manager configuration.

### Tracing the error to the auto-blocking script

When this error occured I confirmed it was specifically the auto-blocking script (e.g. https://cdn.cookielaw.org/consent/SITE-ID/OtAutoBlock.js) that was causing this. 
Confirming this fairly easy. Using Chrome developer tools [local overrides](https://developer.chrome.com/blog/new-in-devtools-65/#overrides) I tried removing just the auto-block script, but leaving the otSDKStub.js script, and observed that the error was no longer happening.

### Digging in to the auto-block script

The next question became what part of that script was causing the error. This was time consuming and difficult to do (the fact that the file is obfuscated doesn't help with this). One of the things in the auto-block script that stood out to me was as a variable that looked something like this...

```
var x = JSON.parse('[{"Tag":"https://www.googletagmanager.com/gtm.js","CategoryId":["C0002"],"Vendor":null},{"Tag":"https://dpm.demdex.net/ibs:dpid\x3d28645\x26dpuuid\x3d","CategoryId":["C0004"],"Vendor":null},{"Tag":"https://contextual.media.net/cksync.php","CategoryId":["C0004"],"Vendor":null},
```
{:.wrap}

With some clues from OneTrust I realized that this variable contains a mapping of "Tag"s (which are just URLs) to OneTrust cookie categories (e.g. C0002).

I was eventually able to determine that auto-block script  checks each script as it's added to the page against this list of tags (using a `MutationObserver`). If the script is contained in the list of tags it switches the `type` from `application/javascript` to `text/plain` and adds a class attribute listing with the appropriate cookie categories. This will prevent the script from being executed.

Later, in the `otBannerSdk.js` JavaScript the `reactivateScriptTag` function will run, and it will replace the `text/plain` script tags with new script tags with type `application/javascript`.

### So why were we getting the error

What I was eventually able to determine was that the tag list variable for this site contained a tag like this

```
{"Tag":"https://www.example.com/","CategoryId":["C0002"],"Vendor":null}
```
{:.wrap}

I've replaced the actual client's domain with example.com here. As you can see somehow the home page of the website was listed as a "Tag".

The effect of this was that script tags such as the `require.js` tag were actually subject to the auto-block logic. They were getting a `text/plain` type applied initially to them on page load. Later the `reactivateScriptTag` would re-enable them (assuming the user hadn't opt-ed out of that cookie category -- we were testing with an Opt-Out consent model). However before `reactivateScriptTag` would run there were other inline scripts that were trying to call `require` or `require.config`, hence the error.

### The root of the issue

The remaining open question was, how does the tag list variable get generated? Through some hints from OneTrust support what I determined was that the tag configuration in the auto-block script is actually generated based on the "sources" attributed to each cookie.

<img
  class="rounded shadow"
  src="/img/blog/magento-onetrust-require-is-not-a-function/onetrust-cookie-sources@1x.png"
  srcset="/img/blog/magento-onetrust-require-is-not-a-function/onetrust-cookie-sources@1x.png 1x, /img/blog/magento-onetrust-require-is-not-a-function/onetrust-cookie-sources@2x.png 2x"
  alt="Screenshot of cookie sources in OneTrust UI">

OneTrust attempts to determine the cookie sources during the site scan, but in our case, many cookies had actually been incorrectly attributed to the client's home page (e.g. https://www.example.com). While I'm not sure why the scan had this result (interestingly this didn't happen in lower environments), OneTrust actually pointed me to some of their documentation which notes that when using auto-block it's necessary to manually review the cookie sources for all the cookies to make sure it's correct.

### Fixing the issue

In order the fix the issue I had to review the source for each and every cookie one-by-one and determine the correct sources. For non-Magento issued cookies clearly it shouldn't be a URL under example.com. For the Magento cookies, the best seems to be just remove any source ([Magento documentation](https://docs.magento.com/user-guide/v2.3/stores/cookie-reference.html) states that their cookies are exempt. Generally I was able to correct the sources through the OneTrust recommended workflow. but in some cases cookies had been incorrectly attributed to nearly 2,000 URLs on the client's site. For these cases the solution I came up with was the delete and manually re-create the cookie in the UI.

### Conclusion

In the end implementing cookie blocking is a lot of work even if you use the auto-block. That being said, I still believe that using auto-block will save a lot of engineering time compared to manual blocking and continue to think it's the best option when implementing OneTrust cookie consent.