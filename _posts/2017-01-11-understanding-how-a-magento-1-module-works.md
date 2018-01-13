---
layout: blog-single
title: Understanding How A Magento 1 Module Works
description: In which I document how to review and understand how Magento 1 modules work
date: January 11, 2017
image: 
tags: [Magento]
ad: domain-clamp-ad-b.html
---

As a developer, [there's a good chance you spend more time reading code than you do writing it](https://blogs.msdn.microsoft.com/oldnewthing/20070406-00/?p=27343). In the world of Magento, a lot of that time will be spent reading through the source code of custom and community modules. 

In this post, I'll provide some tips to help you understand how these modules work.

<!-- excerpt_separator -->

### config.xml - Where it all starts

Each module will include a file in the `etc` folder called `config.xml`. For example, [here's](https://github.com/AOEpeople/Aoe_Scheduler/blob/90e5013ca951a5c9467493e09c7d0f8ed1aff963/app/code/community/Aoe/Scheduler/etc/config.xml)  the `config.xml` file for the very popular (deservedly so) module Aoe_Scheduler.

This is the best place to start when reviewing a module as **this is where all behavior for the module is declared**. 

For the duration of this post, I'll go through various declarations you'll find in `config.xml`.

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This post does not cover *every* possible thing one can declare in `config.xml`, but covers some of the most popular ones.</p>
</div>

### Observers

Magento dispatches [hundreds of events](https://www.nicksays.co.uk/magento-events-cheat-sheet-1-9/) at various points of execution in the context a single request. [Observers](http://devdocs.magento.com/guides/m1x/magefordev/mage-for-dev-1.html#8) provide a way for modules to introduce custom behavior by hooking into these events. A module can hook into an event as follows...

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <global>
        <models>
            <foo_bar>
                <class>Foo_Bar_Model</class>
            </foo_bar>
        </models>
    </global>
    <frontend>
        <events>
            <controller_front_send_response_before>
                <observers>
                    <foo_bar>
                        <class>foo_bar/observer</class>
                        <method>baz</method>
                    </foo_bar>
                </observers>
            </controller_front_send_response_before>
        </events>
    </frontend>
</config>
```

That's a lot to swallow. 

The important code is here...

```xml
<frontend>
    <events>
        <controller_front_send_response_before>
            <observers>
                <foo_bar>
                    <class>foo_bar/observer</class>
                    <method>baz</method>
                </foo_bar>
            </observers>
        </controller_front_send_response_before>
    </events>
</frontend>
```

In this case, the `baz` method will be called on `Foo_Bar_Model_Observer` when Magento dispatches the `controller_front_send_response_before` event (which is the last thing to fire before Magento sends the response).

A few things of note about observers...

1. Observers can be registered under the `frontend`, `adminhtml`, or `global` nodes. As you probably suspect, `frontend` observers will execute for events dispatched on requests made to the frontend of the Magento installation, `backend` observers will execute for events dispatched on the backend, and `global` observers will execute for both.
2. Observers will receive an instance of `Varien_Event_Observer`. Through that object, observers can access arguments passed when the event was dispatched.

Observers are the preferred way to inject custom behavior into the execution of the Magento application, but in some cases they are infeasible to use, such as if Magento does not dispatch an event at the appropriate time.

### Rewrites

When customizations via observers are infeasible, rewrites are the next best option. However, some modules may use rewrites even when the same behavior could have been achieved with an observer, which is unfortunate. Rewrites allow a module to provide an alternate implementation of a class which Magento will use instead. They look like this...

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <global>
        <models>
            <foo_bar>
                <class>Foo_Bar_Model</class>
            </foo_bar>
            <sales>
                <rewrite>
                    <order>Foo_Bar_Model_Order</order>
                </rewrite>
            </sales>
        </models>
    </global>
</config>
```

The important code is here...

```xml
<sales>
    <rewrite>
        <order>Foo_Bar_Model_Order</order>
    </rewrite>
</sales>
```

In this case, when Magento asks to an instance of `Mage_Sales_Model_Order` by calling `Mage::getModel('sales/order')` it will receive an instance of `Foo_Bar_Model_Order` instead. When using rewrites it is best practice to only override the methods than need to be customized in the rewrite.

There are a few reasons why observers are better than rewrites...

1. If a Magento upgrade or security patch changes the internals of a rewritten method, the changes won't be realized unless the rewrite is also update
2. You'll run into issues if multiple modules attempt to rewrite the same class.

### Layout Updates

Modules may introduce frontend changes by providing layout update files. These will be declared in `config.xml` as well.

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <frontend>
        <layout>
            <updates>
                <foo_bar>
                    <file>foo_bar.xml</file>
                </foo_bar>
            </updates>
        </layout>
    </frontend>
</config>
```

`foo_bar.xml` will then be the reference for how any templates or static assets included in the module are rendered by Magento.

### Database Changes

Modules may introduce database changes via the `resource` node as follows...

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <global>
        <resources>
            <foo_bar_setup>
                <setup>
                    <module>Foo_Bar</module>
                    <class>Mage_Core_Model_Resource_Setup</class>
                </setup>
                <connection>
                    <use>setup</use>
                </connection>
            </foo_bar_setup>
        </resources>
    </global>
</config>
```

[Setup scripts ](http://devdocs.magento.com/guides/m1x/magefordev/mage-for-dev-6.html) will then be found in the `sql` folder and data installation scripts will be found in the `data` folder.

Schema changes, especially on tables such as `sales_flat_quote` or `sales_flat_quote_item` are something to be careful of in regards to deployment as [the `ALTER TABLE` statements can impact production traffic](https://www.percona.com/blog/2014/11/18/avoiding-mysql-alter-table-downtime/).

### Cron jobs

Modules may register cron jobs as follows...

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <global>
        <models>
            <foo_bar>
                <class>Foo_Bar_Model</class>
            </foo_bar>
        </models>
    </global>
    <crontab>
        <jobs>
            <foo_bar>
                <schedule>0 * * * *</schedule>
                <run>
                    <model>foo_bar/observer::run</model>
                </run>
            </foo_bar>
        </jobs>
    </crontab>
</config>
```

In this case the `run` method of `Foo_Bar_Model_Observer` will be scheduled to run every hour by the Magento cron scheduler. Cron schedules can also be set to pull from [the system configuration](http://alanstorm.com/custom_magento_system_configuration/).

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <global>
        <models>
            <foo_bar>
                <class>Foo_Bar_Model</class>
            </foo_bar>
        </models>
    </global>
    <crontab>
        <jobs>
            <foo_bar>
                <schedule>
                    <config_path>foo/bar/baz</config_path>
                </schedule>
                <run>
                    <model>foo_bar/observer::run</model>
                </run>
            </foo_bar>
        </jobs>
    </crontab>
</config>
```

### Controllers

If the module plans to introduce a controller, it will also need to be declared in `config.xml`. New admin controllers tend to be more common. They'll be declared as follows...

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <admin>
        <routers>
            <adminhtml>
                <args>
                    <modules>
                        <Foo_Bar before="Mage_Adminhtml">Foo_Bar_Adminhtml</Foo_Bar>
                    </modules>
                </args>
            </adminhtml>
        </routers>
    </admin>
</config>
```

### Default Settings

For modules that introduce new system configuration options, the default selections for these option can be set in `config.xml`. This will be represented as follows...

```xml
<?xml version="1.0"?>
<config>
    <modules>
        <Foo_Bar>
            <version>0.1.0</version>
        </Foo_Bar>
    </modules>
    <default>
        <foo>
            <bar>
                <baz>0 * * * *</baz>
            </bar>
        </foo>
    </default>
</config>
```

### Conclusion

I hope that some of you found this post helpful for understanding how Magento modules work. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
