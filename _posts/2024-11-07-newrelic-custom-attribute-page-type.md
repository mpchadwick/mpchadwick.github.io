---
layout: blog-single
title:  "FACET-ing New Relic PageViewTiming Data By 'Page Type'"
date: November 7, 2024
image: 
tags: [Monitoring, Tools, Performance, New Relic]
related_posts:
---

New Relic's [`PageViewTiming`](https://docs.newrelic.com/docs/browser/new-relic-browser/page-load-timing-resources/pageviewtiming-async-or-dynamic-page-details/) data set provides excellent visibility into important performance metrics such as Core Web Vitals. When analyzing this data it can be useful to segment it by "page type" &mdash; for example, on an ecommerce website it can be helpful to know LCP or CLS scores for the product detail page, or product listing page individually. While it's possible to view performance metrics for specific page URLs via the default `pageUrl` field, a website can have thousands (or more) of unique URLs for a given page type. Unless a predictable and consistent pattern is used for all URLs of a specific page type, by default it is not possible to segment data this way.

<!-- excerpt_separator -->

### New Relic "Custom Attributes"

This issue can be solved by using New Relic [custom attributes](https://docs.newrelic.com/docs/data-apis/custom-data/custom-events/collect-custom-attributes/), which will be available when querying the `PageViewTiming` data set. The browser agent provides a [`setCustomAttribute`](https://docs.newrelic.com/docs/browser/new-relic-browser/browser-apis/setcustomattribute/) function, which can be used for this purpose.

For example, in the case of Magento / Adobe Commerce, the "page type" can be identified consulting the list of `classList` of the `<body>` element. The below snippet can be used to quickly and easily set the `pageType` attribute for the product and category pages.

```html
<script>
    (function() {
        if (!window.newrelic) {
            return;
        }

        if (document.body.classList.contains('catalog-category-view')) {
            newrelic.setCustomAttribute('pageType', 'catalog/category/view');
            return;
        }

        if (document.body.classList.contains('catalog-product-view')) {
            newrelic.setCustomAttribute('pageType', 'catalog/product/view');
            return;
        }
    })();
</script>
```

Once in place, `pageType` can be used for `FACET`-ing and `WHERE` clauses in your NRQL queries.


