---
layout: blog-single
title: Accessing the admin front name programmatically in Magento 2
description: Here I'll show you how programmatically resolve the admin front name in Magento 2.
date: March 23, 2017
image: 
tags: [magento 2]
ad: domain-clamp-ad-b.html
---

Recently I was working on some Magento 2 code where I needed to programmatically determine the admin front name. If you run a Google search you'll pretty quickly find [the canonical answer for Magento 1](http://magento.stackexchange.com/questions/73088/get-admin-path-programatically)...

```php?start_inline=1
Mage::getConfig()->getNode('admin/routers/adminhtml/args/frontName')
```

However, even after reading through two pages of Google results, I was not able to find an answer for Magento 2.

<!-- excerpt_separator -->

I decided to dig into the code myself and found that `Magento\Framework\App\AreaList` seems to be the best solution. Specifically the `getFrontName` method will give you the answer you need if you pass "adminhtml" as the `$areaCode` argument. 

Here's a quick example of how an implementation looks...

```php
<?php

namespace Mpchadwick\Foo\Model;

use Magento\Framework\App\AreaList;

class Bar
{
    public $adminFrontName;
    
    public function __construct(AreaList $areaList)
    {
        $this->adminFrontName = $areaList->getFrontName('adminhtml')        
    }
}
```

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.