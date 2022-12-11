---
layout: blog-single
title:  "How Magento's JavaScript Block Loader Works"
date: December 11, 2022
image: 
tags: [Magento]
related_posts:
---

I've been looking at a Magento site where multiple loaders show up in different areas on the cart page. The loaders look something like this:

<img
  class="rounded shadow"
  src="/img/blog/magento-javascript-block-loader/block-loader.jpeg"
  alt="Screenshot of what the loader looks like">

I did a bit of a deep dive into what actually causes these loader to show up. In this post I'll share my findings.

<!-- excerpt_separator -->

### Magento_Ui/js/block-loader

Loaders that show up in a specific area of the page are typically powered by `Magento_Ui/js/block-loader`.

This component creates a [custom knockout binding](https://knockoutjs.com/documentation/custom-bindings.html) called `blockLoader`

```javascript
ko.bindingHandlers.blockLoader = {
    /**
     * Process loader for block
     * @param {String} element
     * @param {Boolean} displayBlockLoader
     */
    update: function (element, displayBlockLoader) {
        element = $(element);

        if (ko.unwrap(displayBlockLoader())) {
            blockLoaderElement.done(addBlockLoader(element));
        } else {
            blockLoaderElement.done(removeBlockLoader(element));
        }
    }
};
```

Reference: [https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Ui/view/base/web/js/block-loader.js#L76-L93](https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Ui/view/base/web/js/block-loader.js#L76-L93)

If the binding value is `true` the `addBlockLoader` function will be called (and if `false` it will call `removeBlockLoader`.

### Using the binding

`Magento_Checkout/js/view/cart/totals` provides a good example of how to use the binding.

The component has an `isLoading` property, which is mapped to `isLoading` in `Magento_Checkout/js/model/totals`

```javascript
define([
    'jquery',
    'uiComponent',
    'Magento_Checkout/js/model/totals',
    'Magento_Checkout/js/model/shipping-service'
], function ($, Component, totalsService, shippingService) {
    'use strict';

    return Component.extend({
        isLoading: totalsService.isLoading,
```

Reference: [https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/js/view/cart/totals.js#L5-L14](https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/js/view/cart/totals.js#L5-L14)

Then in the template file `Magento_Checkout/template/cart/totals.html` we can see the custom binding set on the wrapper div.

```html
<div class="table-wrapper" data-bind="blockLoader: isLoading">
```

Reference: [https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/template/cart/totals.html](https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/template/cart/totals.html)

In `Magento_Checkout/js/model/totals` we can see that `isLoading` is an observable, initially set to `false`.

```javascript
isLoading: ko.observable(false),
```

Reference: [https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/js/model/totals.js#L31](https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/js/model/totals.js#L31)

If we search for `isLoading` across the codebase we find many places that toggle the value, which will cause the loader to show. For example in `Magento_Checkout/js/action/get-totals.js`

```javascript
        totals.isLoading(true);

        return storage.get(
            resourceUrlManager.getUrlForCartTotals(quote),
            false
        ).done(function (response) {
            var proceed = true;

            totals.isLoading(false);
```

Reference: [https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/js/action/get-totals.js#L21-L29](https://github.com/magento/magento2/blob/2.4.5-p1/app/code/Magento/Checkout/view/frontend/web/js/action/get-totals.js#L21-L29)

### Monitoring loader display

One thing that could be interesting to put in place is monitoring to track how much time the site users spend seeing loaders. Doing so would require patching `Magento_Ui/js/block-loader`.

Adding a tracker that flags when the block loader shows and when it's hidden can be done as follows.

**`addBlockLoader`**

```javascript
function addBlockLoader(element) {
    console.log(`addBlockLoader ${element.context.className} ${element.context.id} ${performance.now()}`);
``` 

**`removeBlockLoader`**

```javascript
function removeBlockLoader(element) {
    if (!element.has(blockLoaderClass).length) {
        return;
    }
    console.log(`removeBlockLoader ${element.context.className} ${element.context.id} ${performance.now()}`);
```

From here we can extrapolate how much time the loader was visibile for, and on which area of the page.

Obviously in the real world we would not use `console.log` and instead something like [`newrelic.addPageAction`](https://docs.newrelic.com/docs/browser/new-relic-browser/browser-apis/addpageaction/) (assuming the project is using New Relic).

### Wrap Up

That's all for now. Hopefully you found this helpful because I sure as heck was scratching my head trying to figure out what was causing the spinners to show up.