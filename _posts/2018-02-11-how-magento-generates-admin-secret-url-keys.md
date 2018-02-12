---
layout: blog-single
title:  "How Magento Generates Admin Secret URL Keys"
description: My findings after digging into core Magento code to understand how admin secret URL keys are generated.
date: February 11, 2018
image: 
tags: [Magento]
---

Recently, while looking into a vulnerability for [the Magento Bug Bounty](https://bugcrowd.com/magento) I needed to generate the secret key for an admin URL. While I'd long known that Magento adds these keys for security purposes (specifically to prevent against [CSRF](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)) attacks) I never understood how exactly these keys are generated. In this post, I'll document my findings.

<!-- excerpt_separator -->

### How It Works

#### Magento 2

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This below is based on the Magento 2 code base as of version 2.2.2.</p>
</div>


The issue I was investigating was in Magento 2, so that is where I first looked into this. I quickly found my answer in `Magento\Backend\Model\Url`'s `getSecretKey` method. Below is the full method...

```php?start_inline=1
/**
 * Generate secret key for controller and action based on form key
 *
 * @param string $routeName
 * @param string $controller Controller name
 * @param string $action Action name
 * @return string
 */
public function getSecretKey($routeName = null, $controller = null, $action = null)
{
    $salt = $this->formKey->getFormKey();
    $request = $this->_getRequest();
    if (!$routeName) {
        if ($request->getBeforeForwardInfo('route_name') !== null) {
            $routeName = $request->getBeforeForwardInfo('route_name');
        } else {
            $routeName = $request->getRouteName();
        }
    }
    if (!$controller) {
        if ($request->getBeforeForwardInfo('controller_name') !== null) {
            $controller = $request->getBeforeForwardInfo('controller_name');
        } else {
            $controller = $request->getControllerName();
        }
    }
    if (!$action) {
        if ($request->getBeforeForwardInfo('action_name') !== null) {
            $action = $request->getBeforeForwardInfo('action_name');
        } else {
            $action = $request->getActionName();
        }
    }
    $secret = $routeName . $controller . $action . $salt;
    return $this->_encryptor->getHash($secret);
}
```

The important parts are here...

```php?start_inline=1
$salt = $this->formKey->getFormKey();

$secret = $routeName . $controller . $action . $salt;
return $this->_encryptor->getHash($secret);
```

As you can see it concatenates the `$routeName`, `$controller`, `$action` (e.g. salesorderindex) and `$salt` (which is the form key for current session) and passes it to the encryptor to get a hash. But what does the `$this->_encryptor->getHash()` do...?

For that we need to look at `Magento\Framework\Encryption\Encryptor::getHash()`. Here it is...

```php?start_inline=1
/**
 * @inheritdoc
 */
public function getHash($password, $salt = false, $version = self::HASH_VERSION_LATEST)
{
    if ($salt === false) {
        return $this->hash($password);
    }
    if ($salt === true) {
        $salt = self::DEFAULT_SALT_LENGTH;
    }
    if (is_integer($salt)) {
        $salt = $this->random->getRandomString($salt);
    }

    return implode(
        self::DELIMITER,
        [
            $this->hash($salt . $password),
            $salt,
            $version
        ]
    );
}
```

`$salt` if not passed so it hit's this branch...

```php?start_inline=1
return $this->hash($password);
```

Next we have to look at `Magento\Framework\Encryption\Encryptor::hash()`...

```php?start_inline=1
public function hash($data, $version = self::HASH_VERSION_LATEST)
{
    return hash($this->hashVersionMap[$version], $data);
}
```

`$version` is not passed so it defaults to `self::HASH_VERSION_LATEST`, which is set to 1...

```php?start_inline=1
const HASH_VERSION_LATEST = 1
```

Looking at `$hashVersionMap` we can see that means it will use sha256...

```php?start_inline=1
private $hashVersionMap = [
    self::HASH_VERSION_MD5 => 'md5',
    self::HASH_VERSION_SHA256 => 'sha256'
];
```

So, putting it all together, generation basically boils down to this...

```php
$secret = hash('sha256', $module . $controller . $action . $formKey);
```

#### Magento 1

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This below is based on the Magento 1 code base as of version 1.9.3.7.</p>
</div>

Magento 1 is more or less the same, but with a few key differences. The equivalent to Magento 2's `Magento\Backend\Model\Url::getSecretKey()` in Magento 1 is `Mage_Adminhtml_Model_Url::getSecretKey()`. Here it is...

```php?start_inline=1
public function getSecretKey($controller = null, $action = null)
{
    $salt = Mage::getSingleton('core/session')->getFormKey();
    $p = explode('/', trim($this->getRequest()->getOriginalPathInfo(), '/'));
    if (!$controller) {
        $controller = !empty($p[1]) ? $p[1] : $this->getRequest()->getControllerName();
    }
    if (!$action) {
        $action = !empty($p[2]) ? $p[2] : $this->getRequest()->getActionName();
    }
    $secret = $controller . $action . $salt;
    return Mage::helper('core')->getHash($secret);
}
```

The main notable difference is that the module name is not included, meaning that if two modules have the same controller / action they will use the same secret key.

Also, if you look at `Mage_Core_Model_Encryption::hash()` you'll see that Magento 1 uses `md5` instead of `sha256`.

```php?start_inline=1
public function hash($data)
{
    return md5($data);
}
```

Other than that, secret keys in Magento 1 are generated exactly as they are in Magento 2.