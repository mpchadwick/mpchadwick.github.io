---
layout: blog-single
title:  "Mixin is not a function in Magento / Adobe Commerce"
date: December 17, 2024
image: 
tags: [Adobe Commerce, Magento]
related_posts:
---

A few weeks back I found myself staring at the following error on a Magento project. 

```
TypeError: originalPlaceOrderFunction(paymentData,messageContainer).done is not a function. (In 'originalPlaceOrderFunction(paymentData,messageContainer).done(function(response){if(paymentData.method==='subscribe_pro'){$(document).trigger('subscribepro:orderPlaceAfter',[response]);}})', 'originalPlaceOrderFunction(paymentData,messageContainer).done' is undefined);
```
{:.wrap} 

The error was firing in some cases when the user attempted to click the place order button. Googling wasn't much help nor was the error message especially clear about the exact cause. As such I figured I'd do a quick write up to help any future developers who might find themselves in the same shoes.

<!-- excerpt_separator -->

### The Backtrace

The backtrace from the error pointed toward the `place-order-mixin.js` file which was included as part of the Subscribe Pro extension:

Ref: [https://github.com/subscribepro/subscribepro-magento2-ext/blob/8ea9593e3f734f42f3ae462c70cda5d14f5f470a/view/frontend/web/js/action/checkout/place-order-mixin.js#L10](https://github.com/subscribepro/subscribepro-magento2-ext/blob/8ea9593e3f734f42f3ae462c70cda5d14f5f470a/view/frontend/web/js/action/checkout/place-order-mixin.js#L10)

Given that the error was pointing toward a file within the Subscribe Pro module, my first inclination was that this was a bug within their module, however that turned out to not be the case.

### Applying Some Critical Thinking

Thinking more about the error I realized that if `.done` was "not a function", that would indicate that `originalPlaceOrderFunction` was not a [deferred object](https://api.jquery.com/category/deferred-object/). Knowing that [multiple mixins can be declared on a single JavaScript component / function](https://developer.adobe.com/commerce/frontend-core/javascript/mixins/) I became suspicious that perhaps the problem wasn't with Subscribe Pro itself, but rather another mixin returning an unexpected type such as `Boolean` prior to the Subscribe Pro code running.

### Locating The Problematic Mixin

Searching the code I found another mixin also hooked into `Magento_Checkout/js/action/place-order` that was intended to validate that the quote's shipping address contained a phone number.

```javascript
define([
    'mage/utils/wrapper',
    'Magento_Checkout/js/model/quote',
    'mage/translate',
    'Magento_Ui/js/model/messageList'
], function (wrapper, quote, $t, messageList) {
    'use strict';

    return function (placeOrderFunction) {
        return wrapper.wrap(placeOrderFunction, function (originalPlaceOrder, paymentData, messageContainer) {
            var shippingAddress = quote.shippingAddress();
            if (!shippingAddress['telephone']) {
                messageList.addErrorMessage({ message: $t('Phone Number is missing on the Shipping Address.') });
                return false;
            }
            return originalPlaceOrder(paymentData, messageContainer);
        });
    };
});
```

A-ha! So this mixin was returning `false` if the quote's shipping address was missing a phone number. The Subscribe Pro code was subsequently trying to hook into the same function, but failing as it was receiving `Boolean` rather than the expected type.

Fixing the issue would ultimately require refactoring this code to handle phone number validation in a different way, rather than short-circuiting the `place-order` action. 

Lesson learned: If you're authoring a mixin, make sure you are returning the expected type  for compatibility with other mixins.