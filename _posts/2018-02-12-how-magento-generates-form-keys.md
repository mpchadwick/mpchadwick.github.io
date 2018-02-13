---
layout: blog-single
title:  "How Magento Generates Form Keys"
description: A look a Magento core code to understand how form keys are generated.
date: February 12, 2018
image: 
tags: [Magento]
---

As a follow up to my recent article ["How Magento Generates Admin Secret URL Keys"]({{ site.baseurl }}{% link  _posts/2018-02-11-how-magento-generates-admin-secret-url-keys.md %}) I've decided to take a look at yet another mechanism Magento uses to protect against [CSRF](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)) attacks...form keys. In this post we'll dig into Magento's core code to understand how exactly, they are generated in both Magento 1 and Magento 2.

<!-- excerpt_separator -->

### How It Works

#### Magento 2

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This below is based on the Magento 2 code base as of version 2.2.2.</p>
</div>

The code responsible for generating form keys can be found in `Magento\Framework\Data\Form\FormKey::getFormKey()`. Here's the method in its entirely.

```php?start_inline=1
/**
 * Retrieve Session Form Key
 *
 * @return string A 16 bit unique key for forms
 */
public function getFormKey()
{
    if (!$this->isPresent()) {
        $this->set($this->mathRandom->getRandomString(16));
    }
    return $this->escaper->escapeHtmlAttr($this->session->getData(self::FORM_KEY));
}
```

The comment tells us the form key will be a 16 bit unique string. But how specifically is it generated? For that we need to look at `Magento\Framework\Math\Random::getRandomString()`...


```php?start_inline=1
/**
 * Get random string
 *
 * @param int $length
 * @param null|string $chars
 * @return string
 * @throws \Magento\Framework\Exception\LocalizedException
 */
public function getRandomString($length, $chars = null)
{
    $str = '';
    if (null === $chars) {
        $chars = self::CHARS_LOWERS . self::CHARS_UPPERS . self::CHARS_DIGITS;
    }

    if (function_exists('openssl_random_pseudo_bytes')) {
        // use openssl lib if it is installed
        for ($i = 0, $lc = strlen($chars) - 1; $i < $length; $i++) {
            $bytes = openssl_random_pseudo_bytes(PHP_INT_SIZE);
            $hex = bin2hex($bytes); // hex() doubles the length of the string
            $rand = abs(hexdec($hex) % $lc); // random integer from 0 to $lc
            $str .= $chars[$rand]; // random character in $chars
        }
    } elseif ($fp = @fopen('/dev/urandom', 'rb')) {
        // attempt to use /dev/urandom if it exists but openssl isn't available
        for ($i = 0, $lc = strlen($chars) - 1; $i < $length; $i++) {
            $bytes = @fread($fp, PHP_INT_SIZE);
            $hex = bin2hex($bytes); // hex() doubles the length of the string
            $rand = abs(hexdec($hex) % $lc); // random integer from 0 to $lc
            $str .= $chars[$rand]; // random character in $chars
        }
        fclose($fp);
    } else {
        throw new \Magento\Framework\Exception\LocalizedException(
            new \Magento\Framework\Phrase("Please make sure you have 'openssl' extension installed")
        );
    }

    return $str;
}
```

Randomness is always tricky. We can see that Magento first tries to use [`openssl_random_pseudo_bytes`](http://php.net/manual/en/function.openssl-random-pseudo-bytes.php) and falls back OS level generation if not available via [`/dev/urandom`](http://man7.org/linux/man-pages/man4/random.4.html).

#### Magento 1

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This below is based on the Magento 1 code base as of version 1.9.3.7.</p>
</div>


In Magento 1, form key generation happens in `Mage_Core_Model_Session::getFormKey`...

```php?start_inline=1
/**
 * Retrieve Session Form Key
 *
 * @return string A 16 bit unique key for forms
 */
public function getFormKey()
{
    if (!$this->getData('_form_key')) {
        $this->renewFormKey();
    }
    return $this->getData('_form_key');
}
```

Again, it's a unique 16 bit string. But where does it come from this time?

`Mage_Core_Model_Session::renewFormKey()` simply does the following...

```php?start_inline=1
/**
 * Creates new Form key
 */
public function renewFormKey()
{
    $this->setData('_form_key', Mage::helper('core')->getRandomString(16));
}
```

So we need to check `Mage_Core_Helper_Data::getRandomString()`...

```php?start_inline=1
public function getRandomString($len, $chars = null)
{
    if (is_null($chars)) {
        $chars = self::CHARS_LOWERS . self::CHARS_UPPERS . self::CHARS_DIGITS;
    }
    for ($i = 0, $str = '', $lc = strlen($chars)-1; $i < $len; $i++) {
        $str .= $chars[mt_rand(0, $lc)];
    }
    return $str;
}
```

We can see here that [`mt_rand`](http://php.net/manual/en/function.mt-rand.php) is used. In other words, Magento 1 uses a lesser grade of randomness to generate form keys than exists in Magento 2.
