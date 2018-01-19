---
layout: blog-single
title:  "Magento 2 Product EAV Index Failing After Downgrading"
description: A description of an issue a co-worker recently encountered running a product eav index after downgrading Magento
date: January 18, 2018
image:
tags: [Magento]
---

Recently one of my co-workers reported experiencing the following error when running a product eav reindex.

```
SQLSTATE[21S01]: Insert value list does not match column list: 1136 Column count doesn't match value count at row 1, query was: INSERT INTO `catalog_product_index_eav_idx` SELECT DISTINCT  `pid`.`entity_id`, `pid`.`attribute_id`, `pid`.`store_id`, IFNULL(pis.value, pid.value) AS `value` FROM (SELECT DISTINCT  `s`.`store_id`, `s`.`website_id`, `dd`.`attribute_id`, COALESCE(ds.value, dd.value) AS `value`, `cpe`.`row_id`, `cpe`.`entity_id` FROM `store` AS `s`
 LEFT JOIN `catalog_product_entity_int` AS `dd` ON dd.store_id = 0
 LEFT JOIN `catalog_product_entity_int` AS `ds` ON ds.store_id = s.store_id AND ds.attribute_id = dd.attribute_id AND ds.row_id = dd.row_id
 LEFT JOIN `catalog_product_entity_int` AS `d2d` ON d2d.store_id = 0 AND d2d.row_id = dd.row_id AND d2d.attribute_id = 292
 LEFT JOIN `catalog_product_entity_int` AS `d2s` ON d2s.store_id = s.store_id AND d2s.attribute_id = d2d.attribute_id AND d2s.row_id = d2d.row_id
 LEFT JOIN `catalog_product_entity` AS `cpe` ON cpe.row_id = dd.row_id AND (cpe.created_in <= '1509969103' AND cpe.updated_in > '1509969103') WHERE (s.store_id != 0) AND ((ds.value IS NOT NULL OR dd.value IS NOT NULL)) AND (COALESCE(d2s.value, d2d.value) = 1)) AS `pid`
 LEFT JOIN `catalog_product_entity_int` AS `pis` ON pis.row_id = pid.row_id AND pis.attribute_id = pid.attribute_id AND pis.store_id = pid.store_id WHERE (pid.attribute_id IN('802')) AND (IFNULL(pis.value, pid.value) IS NOT NULL) AND (NOT(pis.value IS NULL AND pis.value_id IS NOT NULL))
```
{:.wrap}

The error indicates that `catalog_product_index_eav_idx ` does not match the column list being `INSERT`-ed...

```
`pid`.`entity_id`,
`pid`.`attribute_id`,
`pid`.`store_id`,
IFNULL(pis.value, pid.value) AS `value`
```
		
I asked my co-worker to check and indeed, `catalog_product_index_eav_idx ` contained an additional column (`source_id`). 

<!-- excerpt_separator -->

With some crafty googling I was able to track down an article titled ["Magento2 Upgrdation from 2.2.0 dev to 2.1.6 upgrade eav attribute indexing problem"](http://supportformagento2.blogspot.com/2017/07/magento2-upgrdation-from-22o-dev-to-216.html) (sic) which states the following...

> 1. Its come due to  source_id column  exist in 2.2.0 Dev version but it not exist in latest magento 2.1.6 version
>
> 2. So we have to remove source_id  column from some tables names as :
>
>	 - catalog_product_index_eav
> 	- catalog_product_index_eav_decimal
> 	- catalog_product_index_eav_decimal_idx
> 	- catalog_product_index_eav_idx

I asked my co-worker if he had recently downgraded his environment and in fact, he had recently gone from 2.1.10 back to 2.1.3.

Upon further research I found the following code in `Magento\Catalog\Setup\UpgradeSchema`


```php?start_inline=1
// Magento\Catalog\Setup\UpgradeSchema
if (version_compare($context->getVersion(), '2.1.4', '<')) {
    $this->addSourceEntityIdToProductEavIndex($setup);
}
```

Here's an abbreviated version of  `addSourceEntityIdToProductEavIndex()`...

```php?start_inline=1
$tables = [
    'catalog_product_index_eav',
    'catalog_product_index_eav_idx',
    'catalog_product_index_eav_tmp',
    'catalog_product_index_eav_decimal',
    'catalog_product_index_eav_decimal_idx',
    'catalog_product_index_eav_decimal_tmp',
];

foreach ($tables as $tableName) {
    $tableName = $setup->getTable($tableName);
    $connection->addColumn(
        $tableName,
        'source_id',
        [
            'type' => \Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
            'unsigned' => true,
            'nullable' => false,
            'default' => 0,
            'comment' => 'Original entity Id for attribute value',
        ]
    );
}
```

As you can see, it **does** add the `source_id` column to a number of tables. 

It's a bit odd that the article I found stated that `source_id` was not present in 2.1.6, however the code indicates it is available starting from 2.1.4. Regardless, deleting `source_id` from the tables in question did fix the issue and allowed him to reindex product eav.
