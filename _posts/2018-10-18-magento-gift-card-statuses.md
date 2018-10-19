---
layout: blog-single
title:  "Magento Gift Card Statuses"
description: A detailed explanation of the undocumented statuses for Magento gift card accounts.
date: October 18, 2018
image: /img/blog/magento-gift-card-statuses/gift-card-account-grid@2x.jpg
tags: [Magento]
---

Recently, I fielded a request to generate a detailed gift card usage report.

If you navigate to Marketing > Gift Card Accounts in the admin panel of a Magento 2 site you'll the following grid...

<img
  class="rounded shadow"
  src="/img/blog/magento-gift-card-statuses/gift-card-account-grid@1x.jpg"
  srcset="/img/blog/magento-gift-card-statuses/gift-card-account-grid@1x.jpg 1x, /img/blog/magento-gift-card-statuses/gift-card-account-grid@2x.jpg 2x"
  alt="Screenshot of the gift card accounts grid in the Magento 2 admin panel">

While this is helpful, unfortunately it was lacking some information the client desired such as the date the gift card was used.

In the process of looking at this I became interested in the "Status" column that displayed in the grid. It lists four options...

- Available
- Used
- Redeemed
- Expired

The meaning of these statuses is not exactly clear, nor is it documented anywhere, as far as I can tell. As such, I decided to do a little investigation. Here, I'll detail my findings...

<!-- excerpt_separator -->

### Available

A status of "available" means that there is a balance available on the gift card that can be used or redeemed (more on those terms later). In addition to gift cards accounts without any activity, if the starting gift card account balance was partially used for an order, the status of the gift card will remain "available".

### Used

If the gift card account's status is "used" the gift card balance has been fully used as payment while placing order(s) on the store.

As mentioned above if the gift card account balance is partially used on an order the status of the gift card will remain "available".

<img
  class="rounded shadow"
  src="/img/blog/magento-gift-card-statuses/using-a-gift-card-at-checkout@1x.jpg"
  srcset="/img/blog/magento-gift-card-statuses/using-a-gift-card-at-checkout@1x.jpg 1x, /img/blog/magento-gift-card-statuses/using-a-gift-card-at-checkout@2x.jpg 2x"
  alt="A screenshot showing the UI for using a gift card in checkout">

*Here's the UI for using a gift card at checkout*

### Redeemed

A redeemed gift card is a gift card that has been converted to store credit.

This can be done within the my account section for logged in users.

<img
  class="rounded shadow"
  src="/img/blog/magento-gift-card-statuses/gift-card-redemption@1x.jpg"
  srcset="/img/blog/magento-gift-card-statuses/gift-card-redemption@1x.jpg 1x, /img/blog/magento-gift-card-statuses/gift-card-redemption@2x.jpg 2x"
  alt="A screenshot showing the UI for gift card account redemption">

### Expired

Finally, gift cards become "expired" if the expiration date of the gift card has passed and the gift card is still in an available status.
