---
layout: blog-single
title: WTF Happened to Custom Layout Updates in Magento v2.3.4
date: January 30, 2020
image: /img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-3-category-edit-design-tab@2x.png
tags: [Magento]
---

In versions on Magento prior to v2.3.4, users had the ability to add custom layout updates to category, product and cms pages via a textarea input from the Magento admin panel.

<img
  class="rounded shadow"
  src="/img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-3-category-edit-design-tab@1x.png"
  srcset="/img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-3-category-edit-design-tab@1x.png 1x, /img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-3-category-edit-design-tab@2x.png 2x"
  alt="Screenshot of design tab on category edit screen in Magento v2.3.3">

These updates would then be merged with layout definitions from the theme on the website to impact the overall frontend page rendering. 

Per Magento's release notes, as of Magento v2.3.4, this ability has been removed:

> Removal of custom layout updates and the deprecation of layout updates to remove the opportunity for Remote Code Execution (RCE). The Custom Layout Update field on the CMS Page Edit, Category Edit, and Product Edit pages has now been converted to a selector
> 
> [https://devdocs.magento.com/guides/v2.3/release-notes/release-notes-2-3-4-open-source.html](https://devdocs.magento.com/guides/v2.3/release-notes/release-notes-2-3-4-open-source.html)

I dug into this a bit and shared some info in [this Twitter thread](https://twitter.com/maxpchadwick/status/1222227361397166080?s=20). Here, I'd like to present my findings in a slightly more formal manner, and also offer some additional details.

<!-- excerpt_separator -->

### Some Background

Before we dig into the specifics of this change, it's useful to have an understanding of why Magento made this change.

Generally speaking, giving users the ability freely manage layout / rendering from an administrative panel is a dangerous prospect from a security point-of-view. This opens the door to a class of vulnerability known as ["Server Side Template Injection" (SSTI)](https://portswigger.net/kb/issues/00101080_server-side-template-injection). From a high level, the idea is, an attacker can find ways to abuse the feature by passing unexpected arguments to unexpected functions. This in turn can lead to remote code execution or SQL injection.

Given this danger, Magento decided to remove this feature entirely, effectively shutting down any possible vulnerability that would leverage it.

### What Does The Change Mean for Pre-Existing Layout Updates?

My first questions when I heard about this change were, "What does this mean for pre-existing layout updates? Will they no longer work and need to be migrated in one-way or another?". I couldn't find a clear answer in the Magento release notes, so I dug into it myself.

From a high level, the answer to the question, is "no", you don't *need* to migrate pre-existing custom layout updates and will continue to work. The caveat there is that you will no longer have the ability to edit any pre-existing custom layout updates via the Magento admin panel as the field to do so is no longer visible.

Instead you'll see the "Use existing" option selected from the new "Custom Layout Update" dropdown.

<img
  class="rounded shadow"
  src="/img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-4-category-edit-design-tab@1x.png"
  srcset="/img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-4-category-edit-design-tab@1x.png 1x, /img/blog/magento-2-3-4-custom-layout-updates/magento-2-3-4-category-edit-design-tab@2x.png 2x"
  alt="Screenshot of design tab on category edit screen in Magento v2.3.4">

### How Does The Functionality Work Moving Forward?

Magento has documented this in the ["Create cms-page/product/category-specific layouts" section of the "Common layout customization tasks" document](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/layouts/xml-manage.html#create-cms-pageproductcategory-specific-layouts). The tl;dr; on it is you need to create a physical file within your theme which includes your custom layout instructions. The file name needs to follow a specific pattern, the specifics of which differ spending on whether it's for a category, cms page or product.

**Categories**

`catalog_category_view_selectable_{category_id}_{identifier}.xml`

**CMS Pages** 

`cms_page_view_selectable_{url-key-with-slashes-replaced-with-underscores}_{identifier}.xml`

**Products**

`catalog_product_view_selectable_{sku}_{identifier}.xml`

---

`{category_id}` / `{sku}` / and `{url-key...}` are hopefully all self explanatory there. `{identifier}` in all cases is the string that will show up in the "Custom Layout Update" dropdown menu.

If you want to check out how it works under the hood check out:

- **Categories**: `Magento\Catalog\Model\Category\Attribute\Backend\LayoutUpdate` which is the `source_model` for the `custom_layout_update_file` category attribute
- **CMS Pages**: `Magento\Cms\Model\PageDataProvider` where you'll find how files are fetched in `getMeta`.
- **Products**: `Magento\Catalog\Model\Product\Attribute\Source\LayoutUpdate` which is the `source_model` for the `custom_layout_update_file` product attribute.
 
I haven't personally tested these yet, but according to the documentation the files go "in the appropriate folders for layout XML files." Either the theme's `Magento_Catalog/layout` folder, or a dedicated `SelectableLayouts` module seem to make sense to me.

### Is The New Implementation Sane?

Good question. One project I checked, for better or worse, was re-using the same custom layout update across ~800 categories. In order to migrate to the new system this would require 800 physical custom layout files, one for each category, which is a laughable prospect.

In addition to the ability to create custom layout update files that are specific to one product, category, or cms page, I think there also needs to be the ability to create globally available custom layout updates, that can be applied to any given entity. 

For example, for categories, `catalog_category_view_selectable_global_remove_left_nav.xml`. With this option available, migration to the new mechanics would be feasible for the website in question.