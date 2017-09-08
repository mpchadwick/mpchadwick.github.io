---
layout: blog-single
title:  "PHP Property Type Hints For Security"
description: Some thoughts on how property type hints could be used to prevent unserialize object injection attacks.
date: September 05, 2017
image: 
tags: [Thoughts, Security, PHP]
---

Recently I've been spending a lot of time experimenting with PHP unserialize object injection vulnerabilities. Frequently, exploits against these types of vulnerabilities involve chaining together multiple objects to call unexpected methods on unexpected properties. This technique is known as creating a POP (property oriented programming) chain. Here are a few examples of how that plays out in PHP world...

- [File write in Magento 2 using a POP chain](http://netanelrub.in/2016/05/17/magento-unauthenticated-remote-code-execution/)
- [RCE in Zend Framework 1 using a POP chain](https://www.owasp.org/images/9/9e/Utilizing-Code-Reuse-Or-Return-Oriented-Programming-In-PHP-Application-Exploits.pdf) (example starting on page 41)

In fact, there's even a new project on GitHub called [phpgcc](https://github.com/ambionics/phpggc) which is building a list of generic POP chains ("gadgets"), similar to [ysoserial](https://github.com/frohoff/ysoserial) in the Java world.

<!-- excerpt_separator -->

As I've been thinking about these types of exploits, one thing that came to mind is how property type hinting (which is not currently supported in PHP) could potentially be used to guard against these kinds of attacks.

For example, if we look at the Magento 2 file write chain, we'll see it starts here...

```php?start_inline=1
// Credis_Client
/*
 * Called automaticlly when the object is destrotyed.
 */
public function __destruct()
{
    if ($this->closeOnDestruct) {
        $this->close();
    }
}
 
/*
 * Closes the redis stream.
 */
public function close()
{
    if ($this->connected && ! $this->persistent) {
            ...
            $result = $this->redis->close();
    }
    ...
}
``` 

The chain, which is able to manipulate `Credis_Client`'s properties during unserialization sets the `redis` property to an instance of `Magento\Sales\Model\Order\Payment\Transaction`.

Clearly, the `redis` property of `Credis_Client` is never intended to be an instance of  `Magento\Sales\Model\Order\Payment\Transaction`. In theory, if property type hinting were available, the author of `Credis_Client` could add a type hint that `redis` must be an instance of `Redis`. Then, in an ideal world, unserialization would fail making the chain unsuccessful.

I'm not knowledgeable enough on PHP internals to say whether or not this is even something that is enforceable via the property type. Currently, [the typed properties proposal](https://wiki.php.net/rfc/typed-properties) makes no mention of its impact on `unserialize`. 

If this were available, it would be a nice feature for library authors to prevent their code from being mixed up in exploits due to poor coding practices by end users.