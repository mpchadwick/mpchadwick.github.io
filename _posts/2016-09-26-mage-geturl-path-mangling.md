---
layout: blog-single
title: "Beware: Path mangling introduced by Mage::getUrl()"
description: In this post we take a look at what actually happens when you call Mage::getUrl and how it can unintentionally mangle your URL.
date: September 26, 2016
tags: [magento, backend]
---

I dealt with a pretty interesting issue today. The symptom can be summarized as follows...

> When I access `example.com/1/2/3/4` I get redirected `example.com/1/2/3`

I spent some time reviewing and ultimately found that `Mage::getUrl()` was the cause. In this post I'll explain to you how and why.

<!-- excerpt_separator -->

### Background

The code in question was found in a controller that was completing an SSO handshake. The SAML assertions can contain a `return_to` attribute, which tells the handler where the user should be redirected to after the handshake is complete. The code looked something like...

```php?start_inline=1
$url = Mage::getUrl($this->samlAttributes['return_to']);
$this->_redirectUrl($url);
```

### How Mage::getUrl is advertised

The documentation for `Mage::getUrl()` is pretty vague. Here's the full function...

```php?start_inline=1
/**
 * Generate url by route and parameters
 *
 * @param   string $route
 * @param   array $params
 * @return  string
 */
public static function getUrl($route = '', $params = array())
{
    return self::getModel('core/url')->getUrl($route, $params);
}
```

In the code in question, `Mage::getUrl()` was ultimately just being used to put `Mage::getBaseUrl()` in front of the path. However, as we'll see, `Mage::getUrl()` does more than just that.

### What Mage::getUrl actually does

The path you pass to `Mage::getUrl` will eventually reach `Mage_Core_Model_Url::setRoutePath()`. Here's the entire contents of that method

```php?start_inline=1
/**
 * Set Route Parameters
 *
 * @param array $data
 * @return Mage_Core_Model_Url
 */
public function setRoutePath($data)
{
    if ($this->_getData('route_path') == $data) {
        return $this;
    }

    $a = explode('/', $data);

    $route = array_shift($a);
    if ('*' === $route) {
        $route = $this->getRequest()->getRequestedRouteName();
    }
    $this->setRouteName($route);
    $routePath = $route . '/';

    if (!empty($a)) {
        $controller = array_shift($a);
        if ('*' === $controller) {
            $controller = $this->getRequest()->getRequestedControllerName();
        }
        $this->setControllerName($controller);
        $routePath .= $controller . '/';
    }

    if (!empty($a)) {
        $action = array_shift($a);
        if ('*' === $action) {
            $action = $this->getRequest()->getRequestedActionName();
        }
        $this->setActionName($action);
        $routePath .= $action . '/';
    }

    if (!empty($a)) {
        $this->unsetData('route_params');
        while (!empty($a)) {
            $key = array_shift($a);
            if (!empty($a)) {
                $value = array_shift($a);
                $this->setRouteParam($key, $value);
                $routePath .= $key . '/' . $value . '/';
            }
        }
    }

    return $this;
}
```

Somewhat hilariously, this function builds up an internal variable called `$routePath` and then does nothing with it. However, the part we care about is here...

```php?start_inline=1
while (!empty($a)) {
    $key = array_shift($a);
    if (!empty($a)) {
        $value = array_shift($a);
        $this->setRouteParam($key, $value);
        $routePath .= $key . '/' . $value . '/';
    }
}
```

As you can see, it attempts to turn everything past the 3rd level into key/value pairs, and stores those pairs using `setRouteParam`. If the value is not present, it discards the key. Those params are later referenced in `getRoutePath` to ultimately build the URL.

### Why Would This Matter?

In general it wouldn't since Magento URLs typically follow the format of `module/controller/action/k1/v1/k2/v2`, etc...

However, in this particular case, there was a separate CMS instance installed underneath Magento, and a chance that `return_to` might contain a path to that CMS. 

This is not an uncommon set up and there may be some other use cases I'm not thinking of.

### Conclusion

Bottom line, if you're just looking to put the base URL in front of a path use `Mage::getBaseUrl() . $path` to avoid unintended mangling that might be introduced by `Mage::getUrl()`. This is particularly important is there's a chance the the destination is not actually a Magento controller.

As always, feel free to leave any thoughts in the comments below or reach out to me on [Twitter](http://twitter.com/maxpchadwick).
