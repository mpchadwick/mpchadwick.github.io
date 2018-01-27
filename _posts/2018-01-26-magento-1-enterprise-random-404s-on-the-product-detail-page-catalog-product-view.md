---
layout: blog-single
title:  "Magento 1 Enterprise Random 404s on the Product Detail Page (/catalog/product/view)"
description: My investigation into and findings on an issue that can poison the cache with 404 responses for any product detail page in Magento 1 Enterprise.
date: January 26, 2018
image: 
tags: [Magento]
---

Recently, I received the following email from a client...

> Help! My best selling product is 404-ing! We need this resolved ASAP!!!

Ruh-roh :scream:

My first step, of course, was to visit the URL for myself. Indeed, I got a 404.

Next up I added `?no_cache=1` at the end of the URL. This trick will bypass the full page cache in Magento 1 Enterprise, which the site in question was using. I refreshed the page and lo and behold the 404 was gone.

Digging in (after flushing page cache), I ultimately found a bug that can cause cache poisoning with a 404 response on any product details page if session is considered "invalid".

In this post, let's look at the issue, and how it can be solved.

<!-- excerpt_separator -->

### Digging Through Access Logs

In order to identify the root cause, I began by digging through the logs. The goal...find the first 404 for `GET /my-product` prior to the time the client identified the issue. 

A few quick minutes in Cloudwatch later, I had an answer.

```
159.195.141.131 - - [26/Jan/2018:01:40:02 +0000] "GET /my-product HTTP/1.1" 200 26639 "-" "Mozilla/5.0 (iPhone; CPU iPhone OS 10_1_1 like Mac OS X) AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0 Mobile/14B100 Safari/602.1"
162.178.229.18 - - [26/Jan/2018:01:40:32 +0000] "GET /my-product HTTP/1.1" 404 19709 "-" ""Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
```
{:.wrap}

### Digging Through Exception Logs

I did a little brainstorming and remembered that Magento occasionally shows a 404 in the case of a handled exception, and that Magento caches 404s by default. Therefore, my next course of action was to check the exception logs for a handled exception at that time. 

I was in luck...

```
exception 'Mage_Core_Model_Session_Exception' in /var/www/html/app/code/core/Mage/Core/Model/Session/Abstract/Varien.php:421
Stack trace:
#0 /var/www/html/app/code/core/Mage/Core/Model/Session/Abstract/Varien.php(236): Mage_Core_Model_Session_Abstract_Varien->validate()
#1 /var/www/html/app/code/core/Mage/Core/Model/Session/Abstract.php(84): Mage_Core_Model_Session_Abstract_Varien->init('reports', NULL)
#2 /var/www/html/app/code/core/Mage/Reports/Model/Session.php(43): Mage_Core_Model_Session_Abstract->init('reports')
#3 /var/www/html/app/code/core/Mage/Core/Model/Config.php(1357): Mage_Reports_Model_Session->__construct(Array)
#4 /var/www/html/app/Mage.php(463): Mage_Core_Model_Config->getModelInstance('reports/session', Array)
#5 /var/www/html/app/Mage.php(477): Mage::getModel('reports/session', Array)
#6 /var/www/html/app/code/core/Mage/Reports/Model/Product/Index/Abstract.php(167): Mage::getSingleton('reports/session')
#7 /var/www/html/app/code/core/Mage/Reports/Model/Product/Index/Abstract.php(185): Mage_Reports_Model_Product_Index_Abstract->_getSession()
#8 /var/www/html/app/code/core/Mage/Reports/Model/Event/Observer.php(148): Mage_Reports_Model_Product_Index_Abstract->calculate()
#9 /var/www/html/app/code/core/Mage/Core/Model/App.php(1358): Mage_Reports_Model_Event_Observer->catalogProductView(Object(Varien_Event_Observer))
#10 /var/www/html/app/code/core/Mage/Core/Model/App.php(1337): Mage_Core_Model_App->_callObserverMethod(Object(Mage_Reports_Model_Event_Observer), 'catalogProductV...', Object(Varien_Event_Observer))
#11 /var/www/html/app/Mage.php(448): Mage_Core_Model_App->dispatchEvent('catalog_control...', Array)
#12 /var/www/html/app/code/core/Mage/Catalog/Helper/Product/View.php(135): Mage::dispatchEvent('catalog_control...', Array)
#13 /var/www/html/app/code/core/Mage/Catalog/controllers/ProductController.php(132): Mage_Catalog_Helper_Product_View->prepareAndRender(52955, Object(Mage_Catalog_ProductController), Object(Varien_Object))
#14 /var/www/html/app/code/core/Mage/Core/Controller/Varien/Action.php(418): Mage_Catalog_ProductController->viewAction()
#15 /var/www/html/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php(254): Mage_Core_Controller_Varien_Action->dispatch('view')
#16 /var/www/html/app/code/core/Mage/Core/Controller/Varien/Front.php(172): Mage_Core_Controller_Varien_Router_Standard->match(Object(Mage_Core_Controller_Request_Http))
#17 /var/www/html/app/code/core/Mage/Core/Model/App.php(365): Mage_Core_Controller_Varien_Front->dispatch()
#18 /var/www/html/app/Mage.php(684): Mage_Core_Model_App->run(Array)
#19 /var/www/html/index.php(83): Mage::run('', 'store')
```
{:.wrap}

### Reviewing The Call Stack

Reviewing the call stack I saw the exception was being thrown in `Mage_Core_Model_Session_Abstract_Varien::validate()`. 

This is when things started to smell really bad. A session not passing validation certainly shouldn't lead to a 404 response getting cached for the URL impacting all other users.

What exactly was going on?

I traced the call stack up from there and eventually got to `Mage_Catalog_ProductController::viewAction`. This is where the magic happens...


```php?start_inline=1
try {
    $viewHelper->prepareAndRender($productId, $this, $params);
} catch (Exception $e) {
    if ($e->getCode() == $viewHelper->ERR_NO_PRODUCT_LOADED) {
        if (isset($_GET['store'])  && !$this->getResponse()->isRedirect()) {
            $this->_redirect('');
        } elseif (!$this->getResponse()->isRedirect()) {
            $this->_forward('noRoute');
        }
    } else {
        Mage::logException($e);
        $this->_forward('noRoute');
    }
}
```

Particularly, it was hitting this...

```php?start_inline=1
else {
    Mage::logException($e);
    $this->_forward('noRoute');
}
```

To explain, if the controller catches an exception that doesn't have exception code `ERR_NO_PRODUCT_LOADED` it will log it and show a 404. And Magento will happily cache that 404, hence the cache poisoning.

### How To Fix This

There a few ways one could go about fixing this, but ultimately, it would seem that Magento should avoid saving the response to page cache if session validation does not pass. This can be achieved with the following change...

```diff
diff --git a/app/code/core/Mage/Core/Model/Session/Abstract/Varien.php b/app/code/core/Mage/Core/Model/Session/Abstract/Varien.php
index 98b9d3338..bd0d66d9c 100755
--- a/app/code/core/Mage/Core/Model/Session/Abstract/Varien.php
+++ b/app/code/core/Mage/Core/Model/Session/Abstract/Varien.php
@@ -406,6 +406,7 @@ class Mage_Core_Model_Session_Abstract_Varien extends Varien_Object
         else {
             if (!$this->_validate()) {
                 $this->getCookie()->delete(session_name());
+                Mage::app()->getCacheInstance()->banUse('full_page');
                 // throw core session exception
                 throw new Mage_Core_Model_Session_Exception('');
             }
```

Or, because modifying core is never encouraged (despite all the bugs) this can be handled as a rewrite...

```php?start_inline=1
class Mpchadwick_NonFpcPoisoningSession_Model_Session extends Mage_Core_Model_Session_Abstract_Varien
{
	public function validate()
	{
		try {
			parent::validate();
		} catch (Mage_Core_Model_Session_Exception $e) {
			Mage::app()->getCacheInstance()->banUse('full_page');
			throw $e;
		}

		return $this;
	}
}
```

### But Why Did The Session Fail Validation In The First Place?

I was curious about this too. If you look at `Mage_Core_Model_Session_Abstract_Varien::_validate` (note the underscore) you'll see there are **many** reasons why it could fail. Unfortunately, it only returns a boolean and not the specific reason for the failure to `Mage_Core_Model_Session_Abstract_Varien::validate` which very unhelpfully throws the exception with no message or code, so there's no way for me to know exactly why it failed...

```php?start_inline=1
if (!$this->_validate()) {
    $this->getCookie()->delete(session_name());
    // throw core session exception
    throw new Mage_Core_Model_Session_Exception('');
}
```

However, through some crafty Googling I found the StackExchange question titled ["Magento 1.9.3.1 404 Product page"](https://magento.stackexchange.com/questions/152869/magento-1-9-3-1-404-product-page). The accepted answer outlines a bug which was introduced in Magento 1.9.3.1 / 1.14.3.1 a bug that can cause session validation to fail when it shouldn't. This site was on the newest version of 1.14.3.X so it most likely was hitting that.

While that bug likely also needed fixing, session validation cache poisoning seemed like a bigger issue, so the fix to `Mage_Core_Model_Session_Abstract_Varien ` was priority #1.