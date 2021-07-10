---
layout: blog-single
title:  "Troubleshooting mismatched anonymous define"
date: July 9, 2021
image: 
tags: [JavaScript, Magento 2, Magento, JavaScript]
related_posts:
- "Embedding Dynamic Content Without Sucking"
- "Analyzing Web Vitals Stored in Google Analytics"
- "Magento's Not Sane Google reCAPTCHA v3 Implementation"
---

If you're reading this post you're probably troubleshooting an error like this:

```
(index):10 Uncaught Error: Mismatched anonymous define() module: function(){return wr}
http://requirejs.org/docs/errors.html#mismatch
    at makeError (require.min.js:formatted:86)
    at intakeDefines (require.min.js:formatted:713)
    at require.min.js:formatted:835
    at nrWrapper ((index):10)
```

While the RequireJS documentation provides [some direction on this error](https://requirejs.org/docs/errors.html#mismatch), in practice it can be a nightmare to understand what's actually happening as the error trace provides no indication as to the underlying code causing the issue.

Fortunately, my colleague found an approach for getting to the actual source of the problem. In this post I'll share that approach.

<!-- excerpt_separator -->

### Tracing Back The Error

The key to tracing the error is to set a breakpoint at the place where `makeError` is called. In the trace above that would be inside the `intakeDefines` function.

<img
  class="rounded shadow"
  src="/img/blog/uncaught-mismatched-define/dev-tools@1x.png"
  srcset="/img/blog/uncaught-mismatched-define/dev-tools@1x.png 1x, /img/blog/uncaught-mismatched-define/dev-tools@2x.png 2x"
  alt="Screenshot location in intakeDefines to set breakpoint">
  
Once the breakpoint is set, trigger the error (typically just refresh the page).

When it hits the breakpoint, look at the `args` variable. Specifically look for the `[[FunctionLocation]]` symbol key. This should contain the URL of the script that triggered the error.

<img
  class="rounded shadow"
  src="/img/blog/uncaught-mismatched-define/function-location@1x.png"
  srcset="/img/blog/uncaught-mismatched-define/function-location@1x.png 1x, /img/blog/uncaught-mismatched-define/function-location@2x.png 2x"
  alt="Finding the URL that triggered the error via FunctionLocation">

Once you've identified the script you'll have to decide what to do. In all the cases I've seen of this it's been caused by third party JavaScript. In the example above the problematic code looked like this:

```javascript
e.prototype["catch"] = null;
var c = t.fastdom = t.fastdom || new e;
"f" == (typeof define)[0] ? define(function() {
return c
}) : "o" == (typeof module)[0] && (module.exports = c)
}("undefined" != typeof window ? window : this),
```

Specifically calling `define` like this is no bueno with RequireJS<sup style="display: inline-block" id="a1">[1](#f1)</sup>.

```
define(function() {
```

If it's a third party, likely the best option in the immediate term is to remove the script from the site. Then report the issue to the provider - specifically that their script is not compatible with RequireJS (and as such not compatible with Magento 2, if you're using that). The script can be added back to the site once the provider remediates the issue (assuming they are willing to do so).

### Footnotes

<b id="f1">1 </b>. This is a slight over-simplification, but the bottom line is that the third party script in it's entirety isn't compatible with RequireJS[↩](#a1)