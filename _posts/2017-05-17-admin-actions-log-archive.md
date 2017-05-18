---
layout: blog-single
title: Admin Action Logs Archive
description: A look at how Magento handles admin actions logging.
date: May 17, 2017
image: /img/blog/admin-actions-log-archive/magento2-admin-actions-log-report@2x.jpg
tags: [magento]
ad: domain-clamp-ad-b.html
---

The Admin Actions Log a useful feature of both Magento 1 and 2 Enterprise Edition. For those who haven't seen it before, it offers an audit history of all actions taken by users in the admin panel.

<img
  class="rounded shadow"
  src="/img/blog/admin-actions-log-archive/magento2-admin-actions-log-report@1x.jpg"
  srcset="/img/blog/admin-actions-log-archive/magento2-admin-actions-log-report@1x.jpg 1x, /img/blog/admin-actions-log-archive/magento2-admin-actions-log-report@2x.jpg 2x"
  alt="A screenshot showing the admin actions log">

As with sales, invoices, credit memos and shipments, Magento Enterprise occasionally archives data recorded to the admin actions log. However, for some reason, the mechanics used for archiving admin actions are completely different from how sales data is handled.

Here I'll show you how that process works...

<!-- excerpt_separator -->

### Kicking Things Off

The process of kicking off admin actions log archiving is handled by a cron job. In Magento 1 you'll find the following declaration in `app/code/core/Enterprise/Logging/etc/config,xml`

```xml
<crontab>
    <jobs>
        <enterprise_logging_rotate_logs>
            <schedule>
                <cron_expr>1 2 * * *</cron_expr>
            </schedule>
            <run>
                <model>enterprise_logging/observer::rotateLogs</model>
            </run>
        </enterprise_logging_rotate_logs>
    </jobs>
</crontab>
```

In Magento 2 you'll find it in `vendor/magento/module-logging/etc/crontab.xml`

```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Cron:etc/crontab.xsd">
    <group id="default">
        <job name="magento_logging_rotate_logs" instance="Magento\Logging\Cron\RotateLogs" method="execute">
            <schedule>1 2 * * *</schedule>
        </job>
    </group>
</config>
```

### The Window

In both Magento 1 and 2 the window to archive is managed by the `system/rotation/lifetime` configuration value. In Magento 2, we can see the following line in `Magento\Logging\Cron\RotateLogs::execute`

```php?start_inline=1
$this->eventFactory->create()->rotate(
    3600 * 24 * (int)$this->_coreConfig->getValue('system/rotation/lifetime', 'default')
);
```
In `vendor/magento/module-logging/etc/config.xml` we can see that the lifetime defaults to 60 days.

```xml
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Store:etc/config.xsd">
    <default>
        <system>
            <rotation translate="frequency">
                <lifetime>60</lifetime>
            </rotation>
        </system>
    </default>
</config>
```

### How Admin Actions Are Archived

This is the most interesting thing. Magento handles archiving sales data by deleting records from the `_grid` tables, and creating new records in `_archive` tables in the database. However, for some reason, admin actions are archived by writing the data to a log file. The file is then saved to the file system and the records are deleted entirely from the database.

### Show Me The Code

The process is the same in both Magento 1 and 2. In Magento 2. If we look at `Magento\Logging\Model\ResourceModel\Event::rotate` we'll see the following at the bottom...

```php?start_inline=1
$path = $this->directory->getRelativePath($archive->getFilename());
$stream = $this->directory->openFile($path, 'w');
// dump all records before this log entry into a CSV-file
foreach ($rows as $row) {
    $stream->writeCsv($row);
}
$stream->close();

$connection->delete($this->getMainTable(), ['log_id <= ?' => $latestLogEntry]);
```

`$rows` refers to the data that will be archived (fetched previously based on `$lifetime`). As we can see, it is written to a CSV and then deleted.

### Where's The CSV?

Per `Magento\Logging\Model\Archive::getBasePath()`, we can see that the file will be placed in `var/logging/archive`...

```php?start_inline=1
public function getBasePath()
{
    return $this->directory->getAbsolutePath('logging/archive');
}
```

### But Why?

Great question. I have no idea why Magento chose to handle admin actions archiving this way. My best guess is that maybe the dev who built the feature, misinterpreted the task and thought, since the module being worked on is called `Enterprise_Logging` that the data was supposed to be written to a log file. Another potential reason is due to the fact that there is no `_grid` table for admin actions log.

Maybe there's some better reason and this is actually intentional, though.

<!-- excerpt_separator -->

### Conclusion

I hope that some of you found this post helpful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
