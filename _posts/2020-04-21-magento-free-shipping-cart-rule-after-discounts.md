---
layout: blog-single
title: Free Shipping Cart Rule After Discounts
date: April 21, 2020
image: /img/blog/magento-free-shipping-after-discounts/cart-price-rule-free-shipping@1x.png
tags: [Magento]
---

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This below is based on the Magento 2 code base as of version 2.3.4.</p>
</div>

In Magento, a cart price rule can be configured to offer free shipping for orders over a certain dollar amount.

Typically, merchants want this offer to be based on the amount AFTER any discounts are applied.

<!-- excerpt_separator -->

When configuring the cart price rule, there are two options which can be used to specify the threshold at which free shipping should be available, "Subtotal (Excl. Tax)" and "Subtotal".

<img
  class="rounded shadow"
  src="/img/blog/magento-free-shipping-after-discounts/cart-price-rule-free-shipping@1x.png"
  srcset="/img/blog/magento-free-shipping-after-discounts/cart-price-rule-free-shipping@1x.png 1x, /img/blog/magento-free-shipping-after-discounts/cart-price-rule-free-shipping@2x.png 2x"
  alt="Screenshot showing options from conditions dropdown when configuring cart price rule in Magento">

It turns out if you want the offer to be after discounts you **must** use "Subtotal (Excl Tax)" here, otherwise free shipping will be offered based on order amount before discounts.

The condition name is a bit of a misnomer and I didn't find this documented anywhere, so wanted to document it here.

