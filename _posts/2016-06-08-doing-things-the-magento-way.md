---
layout: blog-single
title: "Some Things Should Just Be Done \"The Magento Way\""
date: June 08, 2016
date: June 16, 2016
tags: [Magento, Thoughts, Debugging]
---

Working at a Magento consultancy, I have the privilege of interacting with a plethora of merchants that run their businesses on Magento. One aspect of this that never gets old is all the things merchants think should function differently than how Magento thinks they should function[1]. Here is just a short list of things I've encountered...

- "The search autocomplete functionality should list products (or categories) that "match" the estimated search term rather than (or in addition to) showing other search terms"
- "The top cart should open on hover, not on click"
- "If a customer tries to add a quantity greater than what is available all the available items should be added to the customers cart with an error, rather than just showing an error." 

The list above falls into the category of things that can more or less be safely customized. However, sometimes there are things that you just shouldn't customize. 

Recently, we onboarded a client whose site had customized a couple of those things. In this post I'll outline these examples and demonstrate unintended consequences of trying to make Magento behave differently than it was meant to.

<!-- excerpt_separator -->

### "I should be able to edit an order after it's been placed"

The first issue I dealt with on this site wound up stemming from the fact that a module had been installed on the site to allow orders to be edited. Magento doesn't let you do this by default. If something about the order needs to change you can...

- Cancel the order and create a new one if you have not invoiced it yet.
- Refund and close the order and create a new one if it has been invoiced.

I don't know the exact reasoning for this workflow, but I've been told that it is bad practice from an accounting standpoint to edit an order after it's been placed, which makes sense to me.

Still, this creates an inconvenience to merchants as, in order to create a new order, a new payment is required. If the customer stored their card via something like Authorize.NET CIM, the new order can be created with the token on file, however, if not, customer service will need to contact the customer to accept payment.

The client in question didn't like the way this worked and before they began working with us, a module was installed to allow orders to be edited. Then when they came to use they reported the following issue...

> Credit memos are not syncing to Avalara

The client is using the de facto `OnePica_AvaTax` library. Digging in, I found that following error was occurring when processing the credit memo queue.

```
PHP Fatal error:  Call to a member function getProductType() on a non-object in /path/to/webroot/app/code/community/OnePica/AvaTax/Helper/Calculation.php on line 218
```

Turns out that this was caused as a result of editing orders. Basically, this was happening...

- Customer places an order
    - Each order item is stored in `sales_flat_order_item` and given an `item_id`.
- Credit memo is issued for an item in order.
    - `sales_flat_creditmemo_item.order_item_id` is populated with value from `sales_flat_order_item.item_id`.
- Customer service edits the order and deletes the order item that was refunded.
    - Record is deleted from `sales_flat_order_item`.
    - `sales_flat_creditmemo_item.order_item_id` contains a reference to an order item that doesn't exist. 
- Bad times...

Essentially, if you trace through the `OnePica_AvaTax` code, you'll see that it tried to load the order item referenced in `sales_flat_creditmemo_item.order_item_id` as an object and call the `getProductType()` method on it, hence resulting in the fatal error.

Perhaps it could be argued that this is a bug with the module and it should clear the `order_item_id` column value from any record in `sales_flat_creditmemo_item` when deleting an order, or follow some other path to handle / anticipate this scenario, but I would be more inclined to say that this demonstrates why this is something where you should stick to "The Magento Way". Turns out the credit memo queue was blocked for nearly 1 year on the site in question due to this issue. 

Further, I found that there was a similar fatal error when trying to view the credit memo in the backend. If you check out `app/design/adminhtml/default/default/template/sales/order/creditmemo/view/items.phtml` you'll see it also assumes that it can load the order item as an object and call methods on it. Causing another fatal error. This is something that client hadn't even noticed.

In short, don't delete items from orders, or edit orders at all, for that matter.

### "I should be able to Cancel an order whenever I want"

This is another expectation by the same client in terms of how Magento "should" work. By default, you can only cancel orders before they have been invoiced. This client, however, had the expectation that orders should be cancel-able even after having been invoiced.

Then, the following issue was reported...

> The data I see under Reports > Sales > Refunds doesn't match up with the data I see in the Sales > Credit Memos grid.

My debugging on this one lead me to `Mage_Sales_Model_Resource_Report_Refunded::aggregate()` which is the method that generates the `sales_refunded_aggregated` and `sales_refunded_aggregated_order` tables (the table used to render the reports). Specifically, in both `_aggregateByOrderCreatedAt()` and `_aggregateByRefundCreatedAt()`the following line exists...

```php
<?php

$select->from($sourceTable, $columns)
    ->where('state != ?', Mage_Sales_Model_Order::STATE_CANCELED)
```

Ah ha! So it's filtering out any credit memos where the parent order is in a canceled state. Therefore, any order that went through the following workflow would be impacted...

- Order is placed.
- Order is invoiced.
- Credit memo is issued.
- Order is canceled (put in a canceled state).

In this case, the credit memo would be visible in the grid, but would be filtered out of the reports.

This makes logical sense, because you are not supposed to be able to cancel an order once it's been invoiced, so you shouldn't be able to have a credit memo for a canceled order. Again, this falls into the bucket of something that's better off done "The Magento Way".

### Conclusion

In this post I've demonstrated only a few things that are better done "The Magento Way", but there are surely many more. One other thing I'd like to call out is it's often difficult to know exactly what you should or shouldn't customize until it comes back to bite you later. Hopefully sharing these things will save someone some trouble down the road. 

If you have anything to add feel free to leave it in the comments section below or hit me up on twitter [@maxpchadwick](https://twitter.com/maxpchadwick).

### Footnote(s)

[1] I don't mean this as a jab at merchants. Obviously, I'm not always in agreement with how Magento has decided to do things either, and I can't imagine anyone would agree with *all* the decisions made in a give piece of software. I simply mean this to say that the differences in opinion is a topic that never ceases to interest me.
