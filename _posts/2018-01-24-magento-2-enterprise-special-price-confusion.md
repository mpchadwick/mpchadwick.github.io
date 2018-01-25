---
layout: blog-single
title:  "Magento 2 Enterprise Special Price Confusion"
description: A look at some issues I've encountered with special pricing in Magento 2 Enterprise.
date: January 24, 2018
image: /img/blog/m2-enterprise-special-price-confusion/m2-enterprise-special-price@2x.jpg
tags: [Magento]
---

One of the coolest features in Magento 2 Enterprise (a.k.a Magento Commerce) is [Content Staging](http://docs.magento.com/m2/ee/user_guide/cms/content-staging.html). Content staging allows store administrators to [schedule updates](http://docs.magento.com/m2/ee/user_guide/cms/content-staging-scheduled-update.html) for product attributes, and preview the changes prior to go live including providing a share-able link.

With the introduction of this feature, Magento was faced with a decision...what should be done with pre-existing facilities that already allowed (primitive) scheduling? For example, Special Pricing could already be scheduled via the "Special Price From Date" and "Special Price To Date" attributes.

Ultimately, Magento seems to have decided to attempt to prevent store administrators from using these features at all in favor of scheduled updates. This can be demonstrated both through the source code and documentation. 

While this sounds good in theory, in practice it hasn't worked out so well from what I've seen. In this post I'll discuss my experience and thoughts.

<!-- excerpt_separator -->

### Looking At The Code

If you take a look at `vendor/magento/module-catalog-staging/etc/adminhtml/di.xml` you'll see the following...

```xml
<type name="Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\Eav">
    <arguments>
        <argument name="attributesToEliminate" xsi:type="array">
            <item name="news_from_date" xsi:type="string">news_from_date</item>
            <item name="news_to_date" xsi:type="string">news_to_date</item>
            <item name="custom_design_from" xsi:type="string">custom_design_from</item>
            <item name="custom_design_to" xsi:type="string">custom_design_to</item>
            <item name="special_from_date" xsi:type="string">special_from_date</item>
            <item name="special_to_date" xsi:type="string">special_to_date</item>
        </argument>
    </arguments>
</type>
```

What's going on here? 

If you look at `Magento\Catalog\Ui\DataProvider\Product\Form\Modifier\Eav::getAttributesMeta` you'll see it checks each attribute against the `attributesToEliminate` array and `continue`s if there's a match...

```php?start_inline=1
if (in_array($attribute->getAttributeCode(), $this->attributesToEliminate)) {
    continue;
}
```

Effectively, this XML in `Magento_CatalogStaging` prevents these attributes from being rendered in the admin panel...

If you click the "Advanced Pricing" link on the edit product screen in Magento 2 Enterprise you can see this for yourself...

<img
  class="rounded shadow"
  src="/img/blog/m2-enterprise-special-price-confusion/m2-enterprise-special-price@1x.jpg"
  srcset="/img/blog/m2-enterprise-special-price-confusion/m2-enterprise-special-price@1x.jpg 1x, /img/blog/m2-enterprise-special-price-confusion/m2-enterprise-special-price@2x.jpg 2x"
  alt="Magento 2 Enterprise Special Price">

### What About The Documentation

[The documentation](http://docs.magento.com/m2/ee/user_guide/catalog/product-price-special.html) then makes it clear that "Scheduled Updates" should be used for implementing special pricing.

> **To apply a special price**
>
> 1. Open the product in edit mode
> 2. Tap "Scheduled Update". Then, do the following...

### Problem #1 - Preconceptions and Expectations

Magento is a popular platform. As such, many developers, merchants and solutions specialists are familiar with special pricing from the Magento 1 days. This user base expects the "Special Price From" and "Special Price To" fields to be visible right next to special price in the admin panel. When it's missing, the first reaction is that it's a bug.

For example, on StackExchange a question was asked with title ["Magento2: Attribute News to date, News from date , special from date and special to date doesn't show in admin"](https://magento.stackexchange.com/questions/173590/magento2-attribute-news-to-date-news-from-date-special-from-date-and-special) in May of 2017. Several people attempted to answer but none were correct<sup style="display: inline-block" id="a1">[1](#f1)</sup>.

Another such example can be found in [GitHub issue #5984](https://github.com/magento/magento2/issues/5984) where user [@rramiii](https://github.com/rramiii) left the following comment in August of 2016.

> I installed 2.1.0 ee and can't find special from/to date in advanced pricing, only special price field is available. this is happening for all products

Again, there was no response<sup style="display: inline-block" id="a2">[2](#f2)</sup>.

### Problem #2 - Unexpected Consequences

A more severe problem is that while "Special Price To" and "Special Price From" are not visible in the admin panel, if they do somehow manage to get set, they still impact special pricing behavior.  I've seen multiple issues across multiple Magento installations at this point...

- Special Price From Date was set in the future, preventing special price from working
- Special Price To Date was set in the past, preventing special price from working

Because the attribute values are hidden, store administrators have no way of diagnosing the problem and need to call a developer (who may or may not even think to check the database for this type of thing).

I'm not exactly sure how this data got into the system in these cases, but I have a few theories of how this kind of thing _could_ happen.

- A Magento 1 -> Magento 2 migration could bring special price from / to data along with it
- Authors of 3rd party plugins could, in theory, manipulate these values for some functionality they're looking to implement, not knowing they're not meant to be touched in Enterprise Edition
- Product imports via CSVs or API calls could set these values

These issues have caused enough headaches for one developer to have created the ["M2 Enterprise: How to add Special Price for product from date to date programmatically?"](https://magento.stackexchange.com/questions/148851/m2-enterprise-how-to-add-special-price-for-product-from-date-to-date-programmat) thread on StackExchange

### Proposed Solution

At this point, in my opinion, "Special Price From Date" and "Special Price To Date" should continue to show in Magento 2 Enterprise. 

If merchants want to create a scheduled update they can, but they can also use the good old fashioned attributes (which, as we've seen, many expect to be available) if that's their fancy.

More importantly, making these attributes visible and usuable within the admin can help solve a critical problem where special pricing isn't working and only a (skilled) developer can diagnose it.

### Footnotes

<b id="f1">1 </b>. I have subsequently [added my own answer](https://magento.stackexchange.com/a/210908/28122).[↩](#a1)

<b id="f2">2 </b>. I also [responded](https://github.com/magento/magento2/issues/5984#issuecomment-360345397) to this.[↩](#a2)
