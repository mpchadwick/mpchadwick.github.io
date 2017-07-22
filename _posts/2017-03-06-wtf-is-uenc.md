---
layout: blog-single
title: WTF Is uenc?
description: A look at Magento's uenc parameter
date: March 06, 2017
image: 
tags: [Magento]
ad: domain-clamp-ad-b.html
---

If you've worked with Magento before, you've probably seen a URL that looks like this...

`https://example.com/checkout/cart/add/uenc/aHR0cDovL21hZ2VudG8tMV8xNF8xXzAuZGV2L2xpbmVuLWJsYXplci01MzguaHRtbA,,/product/406/form_key/giZIAWUXy2azlHw1/`

Have you ever wondered to yourself, WTF is `uenc`?

In this post I'll explore that question...

<!-- excerpt_separator -->

### Resolving Referrer URLs

> **NOTE** This post is based on the Magento 1 code base. However, Magento 2 contains the same implementation of `uenc`.

In `Mage_Core_Controller_Varien_Action` there is a function called `_getRefererUrl`. It looks like this...

```php?start_inline=1
protected function _getRefererUrl()
{
    $refererUrl = $this->getRequest()->getServer('HTTP_REFERER');
    if ($url = $this->getRequest()->getParam(self::PARAM_NAME_REFERER_URL)) {
        $refererUrl = $url;
    }
    if ($url = $this->getRequest()->getParam(self::PARAM_NAME_BASE64_URL)) {
        $refererUrl = Mage::helper('core')->urlDecodeAndEscape($url);
    }
    if ($url = $this->getRequest()->getParam(self::PARAM_NAME_URL_ENCODED)) {
        $refererUrl = Mage::helper('core')->urlDecodeAndEscape($url);
    }

    if (!$this->_isUrlInternal($refererUrl)) {
        $refererUrl = Mage::app()->getStore()->getBaseUrl();
    }
    return $refererUrl;
}
```

If you look at the top of `Mage_Core_Controller_Varien_Action ` you'll see that `PARAM_NAME_URL_ENCODED` is defined as follows.

```php?start_inline=1
const PARAM_NAME_URL_ENCODED        = 'uenc';
```

Aha! So `uenc` is an abbreviation for "URL Encoded".

Digging in to `Mage_Core_Helper_Abstract` we can see that `urlDecode` ultimately `base64_decode`s the URL.

```php?start_inline=1
public function urlDecode($url)
{
    $url = base64_decode(strtr($url, '-_,', '+/='));
    return Mage::getSingleton('core/url')->sessionUrlVar($url);
}
```

Putting this all together, we can see that if `uenc` is passed in as a request parameter to Magento it can be used to override the referrer that would otherwise be resolved via `$_SERVER['HTTP_REFERER']`.

### What Do We Do With The Referrer URL?

If you take a look at `_goBack` in `Mage_Checkout_CartController` you'll see the following.

```php?start_inline=1
protected function _goBack()
{
    $returnUrl = $this->getRequest()->getParam('return_url');
    if ($returnUrl) {

        if (!$this->_isUrlInternal($returnUrl)) {
            throw new Mage_Exception('External urls redirect to "' . $returnUrl . '" denied!');
        }

        $this->_getSession()->getMessages(true);
        $this->getResponse()->setRedirect($returnUrl);
    } elseif (!Mage::getStoreConfig('checkout/cart/redirect_to_cart')
        && !$this->getRequest()->getParam('in_cart')
        && $backUrl = $this->_getRefererUrl()
    ) {
        $this->getResponse()->setRedirect($backUrl);
    } else {
        if (($this->getRequest()->getActionName() == 'add') && !$this->getRequest()->getParam('in_cart')) {
            $this->_getSession()->setContinueShoppingUrl($this->_getRefererUrl());
        }
        $this->_redirect('checkout/cart');
    }
    return $this;
}
```

We can see that the referrer URL is accessed here...

```php?start_inline=1
elseif (!Mage::getStoreConfig('checkout/cart/redirect_to_cart')
    && !$this->getRequest()->getParam('in_cart')
    && $backUrl = $this->_getRefererUrl()
) {
    $this->getResponse()->setRedirect($backUrl);
}
```

Let's break this down. You'll be redirected to the referrer URL when adding to cart if...

1. The `return_url` parameter is not passed
2. The store is not configured to redirect the user to the cart
3. The `in_cart` parameter is not passed

### How Is uenc passed?

Going back to the `/checkout/cart/add` URL example above, if we take a look at `getAddToCartUrl` defined in `Mage_Catalog_Block_Product_View` we see the following...

```php?start_inline=1
public function getAddToCartUrl($product, $additional = array())
{
    if ($this->hasCustomAddToCartUrl()) {
        return $this->getCustomAddToCartUrl();
    }

    if ($this->getRequest()->getParam('wishlist_next')) {
        $additional['wishlist_next'] = 1;
    }

    $addUrlKey = Mage_Core_Controller_Front_Action::PARAM_NAME_URL_ENCODED;
    $addUrlValue = Mage::getUrl('*/*/*', array('_use_rewrite' => true, '_current' => true));
    $additional[$addUrlKey] = Mage::helper('core')->urlEncode($addUrlValue);

    return $this->helper('checkout/cart')->getAddUrl($product, $additional);
}
```

The important part is here...

```php?start_inline=1
$addUrlKey = Mage_Core_Controller_Front_Action::PARAM_NAME_URL_ENCODED;
$addUrlValue = Mage::getUrl('*/*/*', array('_use_rewrite' => true, '_current' => true));
$additional[$addUrlKey] = Mage::helper('core')->urlEncode($addUrlValue);

return $this->helper('checkout/cart')->getAddUrl($product, $additional);
```

This is where the `uenc` parameter is prepared and added to the "Add To Cart" URL.

### Conclusion

I hope this post came in useful for some people. I know when I first saw `uenc` in Magento URLs I had no idea what it was. 

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
