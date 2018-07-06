---
layout: blog-single
title:  "Magento's Not Sane AdminNotification Module"
description: A technical deep dive and critique on the mechanics of Magento's admin notification system
date: July 5, 2018
image: /img/blog/magento-admin-notification/example-message@2x.jpg
tags: [Magento]
---

For my past 4 and a half years working with Magento, I've gotten very used to seeing messages like this when I log into the Magento admin panel.

<img
  class="rounded shadow"
  src="/img/blog/magento-admin-notification/example-message@1x.jpg"
  srcset="/img/blog/magento-admin-notification/example-message@1x.jpg 1x, /img/blog/magento-admin-notification/example-message@2x.jpg 2x"
  alt="Example admin notification">

I typically close them out and proceed about my business. I had never quite understood how these notifications work until recently. Here I'll document the not quite sane mechanics behind Magento's admin notification system.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><b>NOTE:</b> This post is based on <code>Magento_AdminNotification</code> as of Magento version 2.2.5</p>
</div>

### Pulling from the Magento Notification RSS Feed

Notifications, it turns out, are pulled from an RSS feed that Magento publishes at [notifications.magentocommerce.com/magento2/community/notifications.rss](https://notifications.magentocommerce.com/magento2/community/notifications.rss). This URL can be found in `vendor/magento/module-admin-notification/etc/config.xml`...

```xml
<?xml version="1.0"?>
<!--
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
-->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Store:etc/config.xsd">
    <default>
        <system>
            <adminnotification>
                <feed_url>notifications.magentocommerce.com/magento2/community/notifications.rss</feed_url>
                <!--
                    More configurations...
                -->
            </adminnotification>
        </system>
    </default>
</config>
```

In `vendor/magento/module-admin-notification/etc/adminhtml/events.xml` we can see that the `adminnotification` observer fires on each `controller_action_predispatch` event...

```xml
<?xml version="1.0"?>
<!--
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
-->
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    <event name="controller_action_predispatch">
        <observer name="adminnotification" instance="Magento\AdminNotification\Observer\PredispatchAdminActionControllerObserver" />
    </event>
</config>
```

This observer calls `checkUpdate` on `Magento\AdminNotification\Model\Feed `...

```php
public function execute(\Magento\Framework\Event\Observer $observer)
{
    if ($this->_backendAuthSession->isLoggedIn()) {
        $feedModel = $this->_feedFactory->create();
        /* @var $feedModel \Magento\AdminNotification\Model\Feed */
        $feedModel->checkUpdate();
    }
}
```

`checkUpdate` consults the update frequency setting and the last updated time to determine if it needs to check the feed...

```php
if ($this->getFrequency() + $this->getLastUpdate() > time()) {
    return $this;
}
```

If it's time to re-fetch the feed it...

- Sends a curl request to the feed url
- Saves any returned item to the `adminnotification_inbox` table if the `title` and `url` don't match a previously saved item

### Showing The Notifications to Admin Users

There are a couple ways that Magento presents notifications to admin users. The one that you're probably most familiar with it the popup after login. This popup is controller by `Magento\AdminNotification\Block\Window::canShow()`

```php
public function canShow()
{
    return $this->_authSession->isFirstPageAfterLogin() && $this->_getLatestItem();
}
```

In English, the popup is shown to the user if...

1. This is the first page the user is viewing after logging in AND
2. The notification's severity was set to "critical" AND 
3. The notification hasn't been marked as read or removed.

Numbers 2 and 3 are specifically driven by `Magento\AdminNotification\Model\ResourceModel\Inbox\Collection\Critical::_initSelect`

```php
protected function _initSelect()
{
    parent::_initSelect();
    $this->addOrder(
        'notification_id',
        self::SORT_ORDER_DESC
    )->addFieldToFilter(
        'is_read',
        ['neq' => 1]
    )->addFieldToFilter(
        'is_remove',
        ['neq' => 1]
    )->addFieldToFilter(
        'severity',
        \Magento\Framework\Notification\MessageInterface::SEVERITY_CRITICAL
    )->setPageSize(
        1
    );
    return $this;
}
```

### Where It Breaks Down

Astute readers may have noticed something interesting about `Magento\AdminNotification\Model\ResourceModel\Inbox\Collection\Critical::_initSelect`...nowhere is the collection filtered for the user id of the currently logged in users. **This is because the `adminnotification_inbox` table has no user id column!** This can be seen by reviewing `vendor/module-admin-notification/Setup/InstallSchema.php` which defines the schema for that table...

```php
$table = $installer->getConnection()->newTable(
    $installer->getTable('adminnotification_inbox')
)->addColumn(
    'notification_id',
    \Magento\Framework\DB\Ddl\Table::TYPE_INTEGER,
    null,
    ['identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true],
    'Notification id'
)->addColumn(
    'severity',
    \Magento\Framework\DB\Ddl\Table::TYPE_SMALLINT,
    null,
    ['unsigned' => true, 'nullable' => false, 'default' => '0'],
    'Problem type'
)->addColumn(
    'date_added',
    \Magento\Framework\DB\Ddl\Table::TYPE_TIMESTAMP,
    null,
    ['nullable' => false, 'default' => \Magento\Framework\DB\Ddl\Table::TIMESTAMP_INIT],
    'Create date'
)->addColumn(
    'title',
    \Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
    255,
    ['nullable' => false],
    'Title'
)->addColumn(
    'description',
    \Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
    '64k',
    [],
    'Description'
)->addColumn(
    'url',
    \Magento\Framework\DB\Ddl\Table::TYPE_TEXT,
    255,
    [],
    'Url'
)->addColumn(
    'is_read',
    \Magento\Framework\DB\Ddl\Table::TYPE_SMALLINT,
    null,
    ['unsigned' => true, 'nullable' => false, 'default' => '0'],
    'Flag if notification read'
)->addColumn(
    'is_remove',
    \Magento\Framework\DB\Ddl\Table::TYPE_SMALLINT,
    null,
    ['unsigned' => true, 'nullable' => false, 'default' => '0'],
    'Flag if notification might be removed'
)->addIndex(
    $installer->getIdxName('adminnotification_inbox', ['severity']),
    ['severity']
)->addIndex(
    $installer->getIdxName('adminnotification_inbox', ['is_read']),
    ['is_read']
)->addIndex(
    $installer->getIdxName('adminnotification_inbox', ['is_remove']),
    ['is_remove']
)->setComment(
    'Adminnotification Inbox'
);
$installer->getConnection()->createTable($table);
```

To summarize this means that admin notifications work something like this...

- Admin notifications are fetched from the Magento RSS feed URL at the configured frequency
- Each time a new item is published to the feed it is saved to the `admin_notification_inbox` table in Magento
- The notification is shown in a pop-up to every user upon login into Magento
- As soon as one user marks the notification as read or removes the notification no other users see the notification
- However, if no users mark the notification as read or remove the notification it will continue to show indefinitely (until the next critical notification gets published)

### Why This Is Not Quite Sane

There are a couple underlying issues with the mechanics behind this module...

1. The idea of a shared notification inbox for all system users in-and-of-itself reeks. If Magento is pushing out critical messages, it's probably a good idea to not allow one user to dismiss them and prevent any other users from seeing them. It is worth noting that there are ACLs to limit user's ability to remove or mark notification as read. While this adds some sanity to the implementation, the underlying architecture of a shared inbox is fundamentally broken.
2. The fact that the pop-up shows indefinitely until dismissed has likely ticked off a number of Magento merchant users. Most users would probably expect that after seeing the notification the first time it would not show again.

Suffice it to say, there is immense room for improvement with this notification system.

### How Could This Be Done Better

First and foremost, there should be a `user_id` column on the `admin_notification_inbox` table and notifications shouldn't be system-wide, they should be to specific users.

Next, the notifications shouldn't show perpetually until you mark them as read. As mentioned previously, users most likely expect to only see these messages once.

Finally, I'd suggest that the notifications Magento publishes be given different categories so that specific roles can be configured to receive specific categories of notifications. For example, store administrators should receive notifications about security updates, but those don't need to the marketing team. However the marketing team might be interested to learn about feature enhancements.

### Conclusion

Have thoughts about this? Leave them below.

Would love to gather feedback here so that this can ultimately be fixed in core.