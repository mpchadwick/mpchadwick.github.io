---
layout: blog-single
title:  "Embedding Dynamic Content Without Sucking"
date: December 18, 2020
image: 
tags: [Frontend]
---

A common pattern for embedding dynamic content on the web looks something like this:

```html
<div id="content-will-go-here"></div>
<script src="//vendor.com/inject-content.js"></script>
```

In this example, the `<div>` is initially empty on the page, and then the JavaScript pulls content from a 3rd party and dynamically injects it into the `<div>`.

While this strategy makes sense in principle, there are a number of issues with the markup presented above. In this post we'll look at how to fix up this approach so that is no longer sucks.

<!-- excerpt_separator -->

### The CLS Problem

The first problem with the markup above that I'd like to address is that of ["Cumulative Layout Shift" (CLS)](https://web.dev/cls/).

As the `<div>` is initially empty it occupies no vertical space on the page during initial render. However, when the vendor JavaScript runs and content is injected the `<div>` expands to accommodate the injected content. This causes everything below it to shift down the page leading the disruptive experience the Google team has coined a "layout shift" as demonstrated in the figure below.

<img
  class="rounded shadow"
  src="/img/blog/embedding-dynamic-content/cls-demo@1x.png"
  srcset="/img/blog/embedding-dynamic-content/cls-demo@1x.png 1x, /img/blog/embedding-dynamic-content/cls-demo@2x.png 2x"
  alt="Figure demonstrating the effect of a layout shift">
  
The solution here is to specify the height property on the `<div>` via CSS.

```html
<div style="height: 102px;" id="content-will-go-here"></div>
<script src="//vendor.com/inject-content.js"></script>
```

Now the space will be pre-allocated prior to the JavaScript running, and when the content is injected there will be no layout shift, as seen in the figure below.

<img
  class="rounded shadow"
  src="/img/blog/embedding-dynamic-content/layout-shift-eliminated@1x.png"
  srcset="/img/blog/embedding-dynamic-content/layout-shift-eliminated@1x.png 1x, /img/blog/embedding-dynamic-content/layout-shift-eliminated@2x.png 2x"
  alt="Figure demonstrating the improvement when the layout shift is eliminated">
  
The catch here is, if you're working with a 3rd party, you may not be in a position to declare a height on the `<div>` as the injected content isn't fully under your control. In this case, I recommend reaching out to the vendor and reporting that their integration approach is problematic from a performance standpoint as it introduces a layout shift. The preferred solution is for the 3rd party to ensure standardized heights for their injected content, which can then be specified on the container `<div>`. If they're not willing to help, this could be a good time to question whether this is actually a 3rd party that is worth working with.

One last tip that can be useful is to use `min-height` instead of `height`. This way if the injected content happens to be taller than expected, the container can grow and won't truncate the content.

### What If The User Has JavaScript Disabled?

While certainly not a common case, I'm firmly of the opinion that a website should not require JavaScript to function (ahem, looking at you [Magento](https://magento.com/)).

Let's look at the implementation above again.

```html
<div style="min-height: 102px;" id="content-will-go-here"></div>
<script src="//vendor.com/inject-content.js"></script>
```

The issue now is, if the JavaScript fails to run the "content-will-go-here" `<div>` will just permanently be empty space on page.

<img
  class="rounded shadow"
  src="/img/blog/embedding-dynamic-content/no-js@1x.png"
  srcset="/img/blog/embedding-dynamic-content/no-js@1x.png 1x, /img/blog/embedding-dynamic-content/no-js@2x.png 2x"
  alt="Screenshot showing what the page will look like if JS doesn't run">

This can be resolved by assuming that JavaScript is disabled and not setting the height in CSS (reverting back to the empty `<div>`), and then using JavaScript to set the height prior to `inject-content.js` running.

```html
<div id="content-will-go-here"></div>
<script>
document.getElementById('content-will-go-here').style.height = "102px";
</script>
<script src="//vendor.com/inject-content.js"></script>
```

This script will run immediately and won't incur a layout shift the way an external script (which needs to negotiate a new DNS / HTTP(s) connection / etc) will.

Now if JavaScript doesn't run we won't be left with the blank space.

### (For Publishers) What If The User Has An Ad Blocker?

For publishers who are injecting ads, one last use case to plan for is users with ad blockers. As a publisher, obviously you would rather users weren't running an ad blocker on your site, however, at the same time, my opinion is we should attempt to give all users a good experience.

If the dynamic content being injected could potentially be blocked by an ad blocker we should plan for this as well, as these users will otherwise be left with whitespace on the screen, the same way as with users with JavaScript disabled.

In this case, you should discuss with the 3rd party to determine how you can check on your end whether or not their scripts have executed successfully. On this site I recently added [EthicalAds](https://www.ethicalads.io/) and found that [I could check whether or not their JavaScript had run by checking if the `ethicalads` object was defined against the document](https://github.com/mpchadwick/mpchadwick.github.io/commit/c0064bf6e6fc2846bdade6210d63c3f1f820bb37).

My approach here was to hide the `<div>` they inject into if `ethicalads` didn't load (I use the JavaScript `defer` property to ensure I'm checking if `ethicalads` is defined **after** their script should have run).

The overall approach is something like this...

**The HTML Document**

```html
<div id="content-will-go-here"></div>
<script>
document.getElementById('content-will-go-here').style.height = "102px";
</script>
<script src="//vendor.com/inject-content.js" defer></script>
<script src="/validate-injection.js" defer></script>
```

**validate-injection.js**

```js
if (typeof vendorInjection === 'undefined') {
    var div = document.getElementById('content-will-go-here');
    div.style.display = "none";
}
```