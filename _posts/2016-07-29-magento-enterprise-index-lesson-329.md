---
layout: blog-single
title: "Magento Enterprise_Index Lesson #329 - Don't TRUNCATE the _cl tables"
description: TRUNCATE-ing the _cl tables can permanently break Magento Enterprise partial reindexing. I'll show you why that happens, and what you can do about it.
date: July 29, 2016
tags: [magento, debugging]
---

I've been looking into a problem recently that was reported by the client as follows...

> "Sold out products continue to show as in stock, until I go into the Magento admin, mark the product as out of stock and save it."

The issue took a **lot** of time to diagnose, but ended up with a really interesting discovery.

**Don't `TRUNCATE` the `_cl` tables** (and no, it wasn't me who did it here, although I'm pretty sure I'm guilty of doing so in other places). 

Let me explain why.

<!-- excerpt_separator -->

### Reindexing By Changelog

`Enterprise_Index` registers an observer `enterprise_refresh_index` (maybe you've seen that before) to execute when Magento cron runs in `always` mode ([which you should run every minute](http://davidalger.com/development/magento/a-new-breed-of-cron-in-magento-ee-1-13-2/)).

Changelog based reindexing will call the `execute` method on the `changelog` `action_model` for each `indexer`. For this investigation, we're concerned about the `cataloginventory_stock` indexer, as the issue we're dealing with is related to inventory being decremented when a product is sold. Let's take a look at `Enterprise_CatalogInventory_Model_Index_Action_Refresh_Changelog::execute()`

```php?start_inline=1
/**
 * Refresh entities by changelog
 *
 * @return Enterprise_CatalogInventory_Model_Index_Action_Refresh_Changelog
 */
public function execute()
{
    $this->_validate();
    $changedIds = $this->_selectChangedIds();
    if (is_array($changedIds) && count($changedIds) > 0) {
        $idsBatches = array_chunk($changedIds, Mage::helper('enterprise_index')->getBatchSize());
        foreach ($idsBatches as $changedIds) {
            $this->_reindex($changedIds);
        }
        $this->_setChangelogValid();
    }
    return $this;
}
``` 

The thing we're interested in is `$this->_selectChangedIds()` which is defined in the grandparent `Enterprise_Index_Model_Action_Abstract()`.

```php?start_inline=1
protected function _selectChangedIds($maxVersion = null)
{
    return $this->_getChangedIdsSelect($maxVersion)->query()->fetchAll(Zend_Db::FETCH_COLUMN);
}
```

OK, next let's look at `_getChangedIdsSelect()`

```php?start_inline=1
protected function _getChangedIdsSelect($maxVersion = null)
{
    if (empty($maxVersion)) {
        $maxVersion = $this->_getCurrentVersionId();
    }
    return $this->_connection->select()
        ->from($this->_metadata->getChangelogName(), array())
        ->where('version_id > ?', $this->_metadata->getVersionId())
        ->where('version_id <= ?', $maxVersion)
        ->columns(array($this->_metadata->getKeyColumn()))
        ->distinct();
}
```

Take a look at that closely.

Do you see what might will happen if you `TRUNCATE` the changelog?

### The Issue

The issue is here...

```php?start_inline=1
->where('version_id > ?', $this->_metadata->getVersionId())
```

`Enterprise_Index` will only `SELECT` ids from the changelog that are greater than version ID that is maintained in the metadata table.

### Metadata?

That's right. 

`Enterprise_Index` maintains a table called `enterprise_mview_metadata` with a column where it tracks the last run `version_id` for each `changelog`. Therefore, if you `TRUNCATE` the changelog table (which you might do if your trying to free up disk space on a DB server), but don't do anything about the `version_id` in the metadata table **you wind up in state where changelog based indexing doesn't work**. This has the tendency to manifest itself through abstract issues reported by a client about "not seeing my updates" which are extremely difficult to diagnose.

### What About Magento's Changelog Cleaning?

You may be saying to yourself..."Wait just one minute, I know there's a changelog cleaning setting in Magento. Does this mean it's not safe to use that?". The answer is "No.". Let's take a look at why.

Magento's scheduled changelog cleaning will eventually execute `Enterprise_Mview_Model_Action_Changelog_Clear::execute()` for each changelog. Here's the definition of that method...

```php?start_inline=1
/**
 * Clear changelog table
 *
 * @return Enterprise_Mview_Model_Action_Changelog_Clear
 */
public function execute()
{
    $this->_connection->delete($this->_metadata->getChangelogName(),
        array('version_id < ?' => $this->_metadata->getVersionId()));
    return $this;
}
```

As you can see it simply `DELETE`s the rows from the changelog with a version ID lower than the version ID found in the metadata table, so the auto incrementing `version_id` column in the changelog will never be less than the version ID maintained in the `metadata` table.

### This is insane, what can we do about it?

I agree.

`TRUNCATE`-ing the changelog tables is a likely eventuality, as servers run into disk space issues (which will eventually happen on every server). **Keep in mind that changelog cleaning is NOT enabled by default.**

This is especially prevalent outside of production in order to free up space when migrating a db from production. I don't have any formal data on how often this type of thing happens. But it seems like Magento should account for this eventuality by either...

1. Add self correction to the metadata version id if the maximum version ID in the changelog is lower
2. Show a warning that the changelog may be "corrupt" in the Index management screen in the admin if this scenario is detected

For now, we're planning to add item number 1 our  [`SomethingDigital_EnterpriseIndexPerf`](https://github.com/sdinteractive/SomethingDigital_EnterpriseIndexPerf/issues/19) module and will be checking for this scenario every time we onboard a new Magento 1 site.
