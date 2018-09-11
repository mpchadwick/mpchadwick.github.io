---
layout: blog-single
title:  "Reindexing Customer Grid Runs out of Memory in Magento&nbsp;2"
description: Details on a bug in Magento 2.1.X where an out of memory fatal error occurs when reindexing the customer grid
date: September 10, 2018
image: 
tags: [Magento]
---

The 2.1.X release line of Magento current contains an issue where, with enough customers, reindexing the customer grid will fail with an out of memory fatal error

```
$ bin/magento indexer:reindex customer_grid
PHP Fatal error:  Allowed memory size of 1073741824 bytes exhausted (tried to allocate 280224918230723 bytes) in /var/www/html/vendor/magento/zendframework1/library/Zend/Db/Statement/Pdo.php on line 228
```
{:.wrap}

The issue is [fixed in the in the 2.2.X release line](https://github.com/magento/magento2/commit/6d98e2a57059ef75d9d0dd0585b84bb33953e107) and can be fixed in 2.1.X by applying [PATCH_MDVA-4538](https://gist.github.com/mpchadwick/a627b4fe6e5299cd3e8f1fdf57cf9b6c).

<!-- excerpt_separator -->

Magento fixed this issue changing the `source` for Customer Grid `<indexer>`...

```diff
diff --git a/vendor/magento/module-customer/etc/indexer.xml b/vendor/magento/module-customer/etc/indexer.xml
index b48592c..5f64442 100644
--- a/vendor/magento/module-customer/etc/indexer.xml
+++ b/vendor/magento/module-customer/etc/indexer.xml
@@ -11,7 +11,7 @@
         <title translate="true">Customer Grid</title>
         <description translate="true">Rebuild Customer grid index</description>
 
-        <fieldset name="customer" source="Magento\Customer\Model\ResourceModel\Customer\Collection"
+        <fieldset name="customer" source="Magento\Customer\Model\Indexer\Source"
```

The new source implements pagination in the `getIterator` method...

```php
public function getIterator()
{
    $this->customerCollection->setPageSize($this->batchSize);
    $lastPage = $this->customerCollection->getLastPageNumber();
    $pageNumber = 0;
    do {
        $this->customerCollection->clear();
        $this->customerCollection->setCurPage($pageNumber);
        foreach ($this->customerCollection->getItems() as $key => $value) {
            yield $key => $value;
        }
        $pageNumber++;
    } while ($pageNumber <= $lastPage);
}
```

