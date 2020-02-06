---
layout: blog-single
title: Render a Category page via a standalone script in Magento 2
date: February 4, 2020
image:
tags: [Magento]
---

In this post I'll share a standalone script that can be used to render a Magento 2 category page. This script can come in handy when debugging production issues on category pages (e.g. unexpected product set). For example, it can be executed under `strace` to review files opened, queries send, and their corresponding results.

<!-- excerpt_separator -->

### The Script

The script is as follows. Change `$categoryId` an `$storeId` as needed.

```php
<?php

use Magento\Framework\App\Bootstrap;

require __DIR__ . '/app/bootstrap.php';

$params = $_SERVER;

$bootstrap = Bootstrap::create(BP, $params);

$obj = $bootstrap->getObjectManager();
$state = $obj->get('Magento\Framework\App\State');
$state->setAreaCode('frontend');

$configLoader = $obj->get('Magento\Framework\ObjectManager\ConfigLoaderInterface');
$obj->configure($configLoader->load('frontend'));

$response = $obj->get('Magento\Framework\App\Response\Http');

$categoryId = '3';
$storeId = '1';

$obj->get('Magento\Store\Model\StoreManagerInterface')->setCurrentStore($storeId);

$controller = $obj->get('Magento\Catalog\Controller\Category\View');

$request = $obj->get('Magento\Framework\App\RequestInterface');

$request->setRouteName('catalog');
$request->setControllerName('category');
$request->setActionName('view');

$request->setParams([
    'id' => $categoryId
]);

$request->setDispatched(true);

$page = $controller->dispatch($request);

$page->renderResult($response);

echo $response->getContent();
```
