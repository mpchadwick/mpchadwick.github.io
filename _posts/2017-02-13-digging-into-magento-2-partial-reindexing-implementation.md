---
layout: blog-single
title: Digging Into Magento 2's Partial Reindexing Implementation
description: An exploration of partial reindexing in Magento 2
date: February 13, 2017
image: 
tags: [Magento 2]
ad: domain-clamp-ad-b.html
---

Partial reindexing was only a thing in Enterprise Edition of Magento 1. In Magento 2, however, it's part of Community Edition. While the overall architecture is pretty much the same, as with all of Magento 2, the code is very different. In this post I'll dig through Magento 2's core code to investigate the implementation.

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This post is based on the Magento 2.1.4 code base.</p>
</div>

<!-- excerpt_separator -->

### Triggers

Partial reindexing uses [MySQL triggers](https://dev.mysql.com/doc/refman/5.7/en/trigger-syntax.html) to track changes that need to be reindexed in changelog tables. Initially, neither the triggers, nor the changelog tables exist in the Magento database. When changing an indexer's mode to "Update on Schedule" `setScheduled(true)` will be called on the indexer instance.

```php?start_inline=true
// Magento\Indexer\Controller\Adminhtml\Indexer\MassChangelog::execute()
foreach ($indexerIds as $indexerId) {
    /** @var \Magento\Framework\Indexer\IndexerInterface $model */
    $model = $this->_objectManager->get('Magento\Framework\Indexer\IndexerRegistry')->get($indexerId);
    $model->setScheduled(true);
}
```

`setScheduled` will call the `subscribe` method on an instance of `Magento\Framework\Mview\View`.

`subscribe` is responsible for creating the changelog table as well as the triggers ("subscriptions" to use Magento's terminology).

```php?start_inline=true
// Magento\Framework\Mview\View::subscribe()
$this->getChangelog()->create();

// Create subscriptions
foreach ($this->getSubscriptions() as $subscriptionConfig) {
    /** @var \Magento\Framework\Mview\View\SubscriptionInterface $subscription */
    $subscriptionInstance = $this->subscriptionFactory->create(
        [
            'view' => $this,
            'tableName' => $subscriptionConfig['name'],
            'columnName' => $subscriptionConfig['column'],
            'subscriptionModel' => !empty($subscriptionConfig['subscription_model'])
                ? $subscriptionConfig['subscription_model']
                : SubscriptionFactory::INSTANCE_NAME,
        ]
    );
    $subscriptionInstance->create();
}
```

After `subscribe` runs, the indexer will have all the pieces it needs to start executing partial reindexing.

### Kicking Things Off

Partials reindexing is kicked off by the `indexer_update_all_views` job which is defined the `crontab.xml` file of the the `Magento_Indexer` module. It looks like this...

```xml
<job name="indexer_update_all_views" instance="Magento\Indexer\Cron\UpdateMview" method="execute">
    <schedule>* * * * *</schedule>
</job>
```

I had previously [blogged about how tweaking schedule can be used to give some control over page cache hit rate]({{ site.baseurl }}{% link _posts/2017-01-30-how-partial-reindexing-schedule-impacts-page-cache-hit-rate.md %}). Unfortunately,  Magento 2 currently doesn't provide any facility for tuning the partial reindexing schedule and has hard coded it to run every minute.

### How The Job Works

If you follow through execution starting at `Magento\Indexer\Cron\UpdateMview` you'll eventually see that it calls the `update` method on `Magento\Framework\Mview\Processor`. 

```php?start_inline=true
public function update($group = '')
{
    foreach ($this->getViewsByGroup($group) as $view) {
        $view->update();
    }
}
```

`getViewsByGroup` asks `Magento\Framework\Mview\Config\Reader` to read all the `mview.xml` files in the code base. Here's an example of an `mview.xml` file from the `Magento_CatalogInventory` module.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Mview/etc/mview.xsd">
    <view id="cataloginventory_stock" class="Magento\CatalogInventory\Model\Indexer\Stock" group="indexer">
        <subscriptions>
            <table name="cataloginventory_stock_item" entity_column="product_id" />
        </subscriptions>
    </view>
</config>

```

After all `mview.xml` files have been read, `Magento\Framework\Mview\View\Collection::loadData()` sets up a collection of `Magento\Framework\Mview\View` instances for each `<view>` defined in the files. 

The loop then calls the `update` method on each instance.

### Updating A View

`update` will ultimately call the `execute` method on the view's "action class" (the "class" defined for the view in the `mview.xml` file). Here's an annotated (and revised for simplicity's sake) version of `Magento\Framework\Mview\View::update()` showing what that process looks like...

```php?start_inline=true
// Get the most recent version from the changelog
$currentVersionId = $this->getChangelog()->getVersion();

// Get the last executed ID from the state
$lastVersionId = $this->getState()->getVersionId();

// Get the ids that need to be reindexed
$ids = $this->getChangelog()->getList($lastVersionId, $currentVersionId);

// Get the indexer instance and reindex
$action = $this->actionFactory->get($this->getActionClass());
$action->execute($ids);
```

The action class typically passes the ids along to the "rows" indexer (e.g. `Magento\CatalogInventory\Model\Indexer\Stock\Action\Rows`)  and registers the  IDs that were reindexed  to the cache context (so that they can be cleaned).

Here's what that looks like in `Magento\CatalogInventory\Model\Indexer\Stock`...

```php?start_inline=true
public function execute($ids)
{
    $this->_productStockIndexerRows->execute($ids);
    $this->getCacheContext()->registerEntities(\Magento\Catalog\Model\Product::CACHE_TAG, $ids);
}
```

### You Should Use Partial Reindexing

I highly recommend you set all of the Magento indexes to "Update by Schedule" mode. You'll see significantly better application performance moving reindexing to a queue rather than handling it synchronously in the context of a web request.

![Queue All The Things](/img/blog/magento-2-partial-reindexing/queue-all-the-things.jpg)

### Conclusion

I hope some of you found this write up helpful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.

### Additional Reading

- [Magento's official document on indexing](http://devdocs.magento.com/guides/v2.0/extension-dev-guide/indexing.html)
- [Kevin Schroeder's write up on the introduction of partial reindexing in Magento Enterprise Edition v1.13](http://www.eschrade.com/page/indexing-in-magento-or-the-wonderful-world-of-materialized-views/)
