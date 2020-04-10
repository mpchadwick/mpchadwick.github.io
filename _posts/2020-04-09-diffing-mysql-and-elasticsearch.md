---
layout: blog-single
title: Diff-ing MySQL and Elasticsearch
date: April 9, 2020
image:
tags: [Magento]
---

Recently I had to troubleshoot an issue where some products that were expected to be indexed in Elasticsearch were not. The client wasn't sure which / how many products were missing, so I wrote a script which diffs products stored in MySQL (`catalog_product_entity`) against the Elasticsearch index. I've decided to share the script here in case others find it useful.

<!-- excerpt_separator -->

Some notes:

- The script is expected to be run from the `var/` directory
- You'll need to update the `$index` variable to the current index name
- The script outputs in the following format:
    - `{{product id}}`: `{{number of documents in elasticsearch}}`

In my case I was able to use this script to identify that a large number of products in the client's catalog were not assigned to any website.

I can't say it's the most beautiful script ever, but it get's the job done.

Hope you find it useful...


```php
<?php

use Magento\Framework\App\Bootstrap;

require __DIR__ . '/../app/bootstrap.php';

$params = $_SERVER;

$bootstrap = Bootstrap::create(BP, $params);

$obj = $bootstrap->getObjectManager();
$con = $obj->get('Magento\Framework\App\ResourceConnection')->getConnection();


$min = 0;
$index = 'magento2_product_1_v264';
$curlHeaders = [
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
curl_setopt($ch, CURLOPT_URL, 'localhost:9200/' . $index . '/_search');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

while (true) {
    $ids = $con->fetchAll('
        SELECT entity_id FROM catalog_product_entity WHERE entity_id > ' . $min .  ' ORDER BY entity_id ASC LIMIT 1000
    ');

    foreach ($ids as $id) {
        $id = $id['entity_id'];
        $postBody = json_encode([
            'query' => [
                'term' => [
                    '_id' => $id
                ]
            ]
        ]);

        curl_setopt($ch, CURLOPT_POSTFIELDS, $postBody);
        $result = curl_exec($ch);
        $result = json_decode($result, true);
        echo $id . ': ' . count($result['hits']['hits']) . PHP_EOL;
    }
    $min = $id;
    if (count($ids) < 1000) {
        break;
    }

}
```