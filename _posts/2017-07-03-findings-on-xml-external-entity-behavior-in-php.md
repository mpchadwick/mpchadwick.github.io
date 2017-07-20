---
layout: blog-single
title: Findings on XML External Entity Behavior in PHP
description: In which I document my experience testing XML External Entity loading across a slew of PHP environments
date: July 03, 2017
image: /img/blog/xxe-test-php/xxe-test.jpg
tags: [security, PHP]
ad: domain-clamp-ad-b.html
---

Recently, I've been experimenting with [XXE (XML External Entity)](https://www.owasp.org/index.php/XML_External_Entity_(XXE)_Processing) vulnerabilities in PHP. 

I've found some inconsistent behavior and posts on the internet that don't exactly line up with my experience. Here, I wanted to document what I've found...

<!-- excerpt_separator -->

### A Useful Test Script

I've found [this script](https://gist.github.com/lukaskuzmiak/c8306a5af855c6faaaee) to be extremely useful for testing XML external entity behavior across various environments. This script creates an external file and then load it as an XML external entity under various configurations (e.g. with the [`LIBXML_NOENT`](http://php.net/manual/en/libxml.constants.php#constant.libxml-noent) flag set, after specifically calling [`libxml_disable_entity_loader(true)`](http://php.net/manual/en/function.libxml-disable-entity-loader.php). I've run this script on a few systems and here are my findings.

### What Usually Happens

In most of the environments I've tested in I get the following...

```
Testing simplexml_load_string
Default behaviour: 
libxml_disable_entity to false: 
libxml_disable_entity to true: 
LIBXML_NOENT: WARNING, external entity loaded!

Testing simplexml_load_file
Default behaviour: 
libxml_disable_entity to false: 
libxml_disable_entity to true: 
LIBXML_NOENT: WARNING, external entity loaded!

Testing DOM (loadXml)
Default behaviour: 
libxml_disable_entity to false: 
libxml_disable_entity to true: 
LIBXML_NOENT: WARNING, external entity loaded!
```
This means that external entity loading ONLY works when the `LIBXML_NOENT` flag is passed when loading the XML.

I've observed this in the following environments...

|OS|PHP Version|libxml2 Version[1]|
|---|---|---|
|CentOS 6.8|5.6.29|2.7.6|
|MacOS 10.10.5|5.5.36|2.9.0|
|Ubuntu 14.04.4|7.0.3|2.9.1|

1\. According to `php -r 'echo LIBXML_DOTTED_VERSION . PHP_EOL;'`

### One Weird Exception

The weird exception I got was running this script in an environment using MAMP.

In that case I got the following...

```
Testing simplexml_load_string
Default behaviour: WARNING, external entity loaded!
libxml_disable_entity to false: WARNING, external entity loaded!
libxml_disable_entity to true: 
LIBXML_NOENT: WARNING, external entity loaded!

Testing simplexml_load_file
Default behaviour: WARNING, external entity loaded!
libxml_disable_entity to false: WARNING, external entity loaded!
libxml_disable_entity to true: 
LIBXML_NOENT: WARNING, external entity loaded!

Testing DOM (loadXml)
Default behaviour: WARNING, external entity loaded!
libxml_disable_entity to false: WARNING, external entity loaded!
libxml_disable_entity to true: 
LIBXML_NOENT: WARNING, external entity loaded!
```

As you can see, in this case the ONLY way to prevent external entity loading is to explicitly call `libxml_disable_entity_loader(true)`.

The specs for the MAMP environment were as follows...

- PHP version: 7.0.12
- libxml2 version: 2.8.0

### External Entity Behavior Changes In libxml2

While reading [OWASP's XXE Prevention Cheat Sheet](https://www.owasp.org/index.php/XML_External_Entity_(XXE)_Prevention_Cheat_Sheet#C.2FC.2B.2B), I found the following note...

> Note: Per: [https://mail.gnome.org/archives/xml/2012-October/msg00045.html](https://mail.gnome.org/archives/xml/2012-October/msg00045.html), starting with libxml2 version 2.9, XXE has been disabled by default as committed by the following patch: [http://git.gnome.org/browse/libxml2/commit/?id=4629ee02ac649c27f9c0cf98ba017c6b5526070f](https://git.gnome.org//browse/libxml2/commit/?id=4629ee02ac649c27f9c0cf98ba017c6b5526070f).
> 
> [OWASP XXE Prevention Cheat Sheet C/C++](https://www.owasp.org/index.php/XML_External_Entity_(XXE)_Prevention_Cheat_Sheet#C.2FC.2B.2B)

This would lead me to believe that environments using libxml2 > 2.9 would be vulnerable to XXE by default as seen in the MAMP environment. However, somehow, the CentOS environment I tested using libxml2 v2.7.6 did not exhibit that behavior :grimacing:

### Final Thoughts

Based on my research it seems that explicitly calling `libxml_disable_entity_loader(true)` is the safest bet to prevent XML External Entity loading across all systems. This is inline with the OWASP recommendation...

> Per [the PHP documentation](http://php.net/manual/en/function.libxml-disable-entity-loader.php), the following should be set when using the default PHP XML parser in order to prevent XXE:
>
> `libxml_disable_entity_loader(true);`
> 
> [OWASP XXE Prevention Cheat Sheet PHP](https://www.owasp.org/index.php/XML_External_Entity_(XXE)_Prevention_Cheat_Sheet#PHP)

[Some threads](https://security.stackexchange.com/questions/133906/is-php-loadxml-vulnerable-to-xxe-attack-and-to-other-attacks-is-there-a-list#answer-133907) you'll find about PHP and XXE will suggest that you do not need to call this function and that `LIBXML_NOENT` needs to be explicitly set for external entities to be loaded. In the environments I tested, this was usually the case, however, it does appear that in some cases, external entities will be loaded by default.