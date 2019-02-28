---
layout: blog-single
title:  "Magento UI Component Magical Data Providers"
description: "An investigation into Magento's magical UI component data provider resolution"
date: February 27, 2019
image:
tags: [Magento]
---

UI components are notoriously one of the most painful aspects of working with Magento 2.

TODO Tweet

One aspect that's thrown me for a loop is the "magical data providers". For example, if you look at `vendor/dotdigital/dotmailer-magento2-extension/view/adminhtml/ui_component/dotdigitalgroup_order_grid.xml` you'll see the following...

```xml
<dataSource name="order_report_grid_data_source">
    <!--The data source-->
    <argument name="dataProvider" xsi:type="configurableObject">
        <argument name="class" xsi:type="string">Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider</argument>
        ...
```

But how could the `Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider` class be responsible for providing data to the order report grid?

<!-- excerpt_separator -->

As with most magic in Magento 2 the answer can be found in `di.xml`. There you'll find the following...

```xml
<type name="Magento\Framework\View\Element\UiComponent\DataProvider\CollectionFactory">
    <arguments>
        <argument name="collections" xsi:type="array">
            <item name="order_report_grid_data_source" xsi:type="string">Dotdigitalgroup\Email\Ui\Model\ResourceModel\Order\Collection</item>
            ...
```

As you can see the if ui_component uses `Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider` as it's data provider the _actual_ data provider can be declared in `di.xml`.

In `Magento\Framework\View\Element\UiComponent\DataProvider\CollectionFactory` we can see how Magento consults it's `collections` property to get an instance of the dataProvider class.

```php
public function getReport($requestName)
{
    if (!isset($this->collections[$requestName])) {
        throw new \Exception(sprintf('Not registered handle %s', $requestName));
    }
    $collection = $this->objectManager->create($this->collections[$requestName]);
    ...
```