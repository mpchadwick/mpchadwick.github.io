---
layout: blog-single
title: A <strike>Trick</strike> Hack To Conditionally Customize A Magento 2 jQuery Widget
description: Documenting my struggles conditionally customizing an M2 jQuery widget
date: April 12, 2017
image:
tags: [Magento 2]
ad: domain-clamp-ad-b.html
---

Recently I've been working on porting `Mpchadwick_SearchAutocompleteConfigmarator` from [Magento 1](https://github.com/mpchadwick/Mpchadwick_SearchAutocompleteConfigmarator) to [Magento 2](https://github.com/mpchadwick/Mpchadwick_SearchAutocompleteConfigmarator2). One of the module's feature's is a switch in the admin panel which allows you to turn off autocomplete. Rather than handling this in the controller, the module prevents the AJAX request from being dispatched entirely, which can be a big help from a scalability standpoint. In Magento 1 I used `ifconfig` to conditionally load a JavaScript file which mutated the `Varien.searchForm` prototype.

**XML**

```xml
<?xml version="1.0"?>
<layout>
    <default>
        <reference name="head">
            <action method="addItem" ifconfig="catalog/search/disable_autocomplete">
                <type>skin_js</type>
                <name>js/mpchadwick_searchautocompleteconfigmarator/disabler.js</name>
            </action>
        </reference>
    </default>
</layout>
```

**JavaScript**

```js
if (typeof Varien.searchForm != 'undefined') {
    // Rather than modifying the controller, or block let's stop it here
    // so the request never even gets dispatched
    Varien.searchForm.addMethods({
        initAutocomplete : function(url, destinationElement) {
            return false;
        }
    })
}
```

In Magento 2, however, the frontend is very different.<!-- excerpt_separator --> Autocomplete is handled through a jQuery widget, which is defined as a RequireJS module.

```js
var config = {
    map: {
        '*': {
            quickSearch: 'Magento_Search/form-mini'
        }
    }
};
```

Magento provides [guidance on how to customize their jQuery widgets](http://devdocs.magento.com/guides/v2.0/javascript-dev-guide/javascript/js_practice.html). The idea is essentially to add a `requirejs-config.js` which tells RequireJs to load your custom implementation instead of the Magento out-of-box implementation.

```js
var config = {
    map: {
        '*': {
            quickSearch: 'Mpchadwick_SearchAutocompleteConfigmarator/form-mini'
        }
    }
};
```

Then extend the parent jQuery widget and insert and relevant customizations...

```js
define([
  'jquery',
  'jquery/ui',
  'mage/quickSearch' 
], function($){
 
  $.widget('mpchadwick.quickSearch', $.mage.quickSearch, {
    // Customizations go here
  });
 
  return $.mpchadwick.quickSearch;
});
```

The problem with this approach is that there's no point at which the configuration can be consulted to determine whether or not the customization needs to happen (which I used `ifconfig` for in Magento 1). I'd need to include a template file and render the configuration file to the document and access it in my custom widget, which feels dirty.

To solve this problem I came up with the following <strike>trick</strike> hack.

### The Hack

Here it is...

Just go ahead and replace out-of-box module module in your `requirejs-config.js`.

**But then**, also create an `afterGetFiles` plugin for `Magento\Framework\RequireJs\Config\File\Collector\Aggregated`. 

In that plugin you can check the configuration value and `unset` your `requirejs-config.js` file from the `$files` array if the feature is disabled. 

The code looks like this...

```php
<?php

namespace Mpchadwick\SearchAutocompleteConfigmarator\Model;

use Magento\Framework\App\Config\ScopeConfigInterface as ScopeConfig;
use Magento\Store\Model\ScopeInterface;
use Magento\Framework\RequireJs\Config\File\Collector\Aggregated as RequireJsCollector;

class RequireJs
{
    const CONFIG_DISABLE_AUTOCOMPLETE = 'catalog/search/disable_autocomplete';

    protected $scopeConfig;

    public function __construct(ScopeConfig $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    public function afterGetFiles(RequireJsCollector $subject, array $files)
    {
        $disabled = $this->scopeConfig->getValue(
            self::CONFIG_DISABLE_AUTOCOMPLETE,
            ScopeInterface::SCOPE_STORE
        );

        if ($disabled) {
            return $files;
        }

        foreach ($files as $k => $v) {
            if ($v->getModule() === 'Mpchadwick_SearchAutocompleteConfigmarator') {
                unset($files[$k]);
            }
        }

        return $files;
    }
}
```

### How I Feel About It

At first I thought this was pretty cool, but the more I think about it, the less I like it. 

First and foremost, `requirejs-config.js` is merged during static file deployment, which means that even after this setting is changed, the changes won't appear on the frontend until, you redeploy static content. Further many deployment strategies run on an isolated deployment server, and this complicates things as now you need to ensure this configuration setting is in sync between production and the deployment server.

At this point it seems the storing the configuration value in the DOM is really the only option. Please let me know if you have any better ideas!

### Conclusion

Hope some of you found this interesting. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
