---
layout: blog-single
title: What Magento's "Allow Symlinks" Setting Actually Does
description: A look at what the "Allow Symlinks" setting in Magento actually does
date: June 01, 2017
image: /img/blog/what-allow-symlinks-actually-does/magento-1-allow-symlinks-setting.jpg
tags: [Magento]
ad: domain-clamp-ad-b.html
---

As a follow up to [Peter O'Callaghan's excellent post about SUPEE-9767 and symlinks](https://peterocallaghan.co.uk/2017/06/appsec-1281-dangerous-symlinks/), I wanted to quickly take a look at what, exactly, the "Allow Symlinks" setting in Magento does. Here we'll dive into the core Magento code to get an understanding of the functionality...

<!-- excerpt_separator -->

### Searching for `dev/template/allow_symlink`

If we search for `dev/template/allow_symlink` in the 1.14.3.2 code base (using [ripgrep](https://github.com/BurntSushi/ripgrep)) we'll see it is only referenced in one place.

```
$ rg 'dev/template/allow_symlink' app 
app/code/core/Mage/Core/Block/Template.php
39:    const XML_PATH_TEMPLATE_ALLOW_SYMLINK       = 'dev/template/allow_symlink';
```

Within that file we can see that constant is referenced in the`_getAllowSymlinks` method...

```php?start_inline=1
protected function _getAllowSymlinks()
{
    if (is_null($this->_allowSymlinks)) {
        $this->_allowSymlinks = Mage::getStoreConfigFlag(self::XML_PATH_TEMPLATE_ALLOW_SYMLINK);
    }
    return $this->_allowSymlinks;
}
```

`_getAllowSymlinks` is called twice.

The first is in `setScriptPath` which [as far as I can tell is completely unnecessary](https://twitter.com/maxpchadwick/status/870464231761747976).

The next check is in `fetchView`. This is where the magic is.

### Validating the View File Path

The code of interest in `fetchView` is as follows..

```php?start_inline=1
$includeFilePath = realpath($this->_viewDir . DS . $fileName);
if (strpos($includeFilePath, realpath($this->_viewDir)) === 0 || $this->_getAllowSymlinks()) {
    include $includeFilePath;
} else {
    Mage::log('Not valid template file:'.$fileName, Zend_Log::CRIT, null, null, true);
}
```

Notably it resolves the `realpath` to the template file and compares it against the `realpath` of the `_viewDir` (typically `/path/to/webroot/app/design`). If your file is symlink-ed from e.g. `/path/to/webroot/.modman/module/template.phtml` the check will fail. This is where the `_getAllowSymlinks` setting kicks in. It says that if that checks fails, just include the file, as long as the setting is set to yes.

### Conclusion

I'm not going to make any of my own statements about this logic, but will say that I agree with the "What the Patch Should Have Done" section of [Peter's blog post](https://peterocallaghan.co.uk/2017/06/appsec-1281-dangerous-symlinks/).
