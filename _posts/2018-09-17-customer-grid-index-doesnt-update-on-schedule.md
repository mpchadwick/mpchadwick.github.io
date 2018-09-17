---
layout: blog-single
title:  "Customer Grid Index Doesn't Update on Schedule"
description: Details on an issue in Magento 2.1.X where the customer grid index doesn't update on schedule.
date: September 17, 2018
image:
tags: [Magento]
---

As a performance and scalability optimization, it is recommended to set all of Magento's indexers to 'Update by Schedule' mode. This can be done at the command line as follows...

```
$ php bin/magento indexer:set-mode schedule
Index mode for Indexer Design Config Grid was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Customer Grid was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Category Products was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Product Categories was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Product Price was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Product EAV was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Stock was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Catalog Rule Product was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Catalog Product Rule was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Catalog Search was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Product/Target Rule was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Target Rule/Product was changed from 'Update on Save' to 'Update by Schedule'
Index mode for Indexer Sales Rule was changed from 'Update on Save' to 'Update by Schedule'
```

However, the customer grid indexer, it turns out, doesn't really support update on schedule.

<!-- excerpt_separator -->

In Magento 2.1.X there is a bug where newly registered customers NEVER show up in the customer grid in the admin panel unless the customer_grid index is full rebuilt from the command line...

```
$ php bin/magento indexer:reindex customer_grid
Customer Grid index has been rebuilt successfully in 00:00:02
```

This issue is logged in the GitHub [here](https://github.com/magento/magento2/issues/10829).

Magento "fixed" this in 2.2.X by forcing the customer grid index to be updated on save, even if it is configured as update on schedule.

```
diff --git a/app/code/Magento/Customer/Model/Customer.php b/app/code/Magento/Customer/Model/Customer.php
index 98c89fdd6958..956696cadc0d 100644
--- a/app/code/Magento/Customer/Model/Customer.php
+++ b/app/code/Magento/Customer/Model/Customer.php
@@ -1077,9 +1077,7 @@ public function reindex()
     {
         /** @var \Magento\Framework\Indexer\IndexerInterface $indexer */
         $indexer = $this->indexerRegistry->get(self::CUSTOMER_GRID_INDEXER_ID);
-        if (!$indexer->isScheduled()) {
-            $indexer->reindexRow($this->getId());
-        }
+        $indexer->reindexRow($this->getId());
     }
```

[https://github.com/magento/magento2/commit/8c465937d22043039c317e03a07a4bf760124724#diff-b825af2e6d0add2867a20213c97c9635](https://github.com/magento/magento2/commit/8c465937d22043039c317e03a07a4bf760124724#diff-b825af2e6d0add2867a20213c97c9635)

This change is also available as patch [MDVA-6616](https://gist.github.com/mpchadwick/28563b0ab36c5e43a59ab5546af9930a).
 
Alternately, you could just set the customer grid indexer mode to Update on Save

```
$ php bin/magento indexer:set-mode realtime customer_grid
Index mode for Indexer Customer Grid was changed from 'Update by Schedule' to 'Update on Save'
```

In the future, hopefully Magento adds proper support for 'Update by Schedule' for the customer grid indexer...