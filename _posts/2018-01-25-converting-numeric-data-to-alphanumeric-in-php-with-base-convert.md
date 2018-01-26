---
layout: blog-single
title:  "Converting Numeric Data to Alphanumeric in PHP with base_convert"
description: A look at how numeric data can be converted to alphanumeric in PHP using the base_convert function.
date: January 25, 2018
image: 
tags: [PHP]
---

Recently a client came to me with the following request...

> We're planning publish "offer codes" in our print circulars so that customers can search for more details on our website. The offer codes our system generates are long and will be cumbersome for users to enter into the search field on the website. What can we do about this?

The offer codes looked something like this...

- PRE-0018004350
- PRE-0027806700
- PRE-1004204400

I thought about it a little and then a lightbulb went off in my head :bulb:

This could be solved by stripping the "PRE-" (which was consistent across every offer code) and converting the remaining numeric data to alphanumeric via a base-10 to base-36 conversion. The result would be short alphanumeric codes that looked something like this...

- APW8U
- GJZSC
- GLVL2O

In this post we'll look at how this can be achieved in PHP.

<!-- excerpt_separator -->

### The Implementation

Converting from numeric to alphanumeric is very easy in PHP. The [`base_convert`](http://php.net/manual/en/function.base-convert.php) function is designed to do exactly this.

Here's the signature for the function...

```php?start_inline=true
string base_convert( string $number, int $frombase , int $tobase )
```

`base_convert` allows for conversion beginning from base-2 (binary) all the way to base-36 (alphanumeric).

This is what the implementation looked like for me...

```php?start_inline
$offerId = 'PRE-0019003400';
$alphanumeric = base_convert($offerId, 10, 36);
```

A couple things worth noting...

- It is not necessary to manually strip off the "PRE-" at the beginning of the offer code (e.g. via [`substr`](http://php.net/manual/en/function.substr.php)) as PHP will automatically strip out any non base-10 characters when converting from base-10.
- `base_convert` is case insensitive with alpha characters, but will generate lowercase when going from base-10 to base-36. 
	- [`strtoupper`](http://php.net/manual/en/function.strtoupper.php) can be used if uppercase alpha characters are desired.
- `base_convert` is not safe with very large numbers. In my case the largest possible number (in decimal) was 9999999999, which is a piece of cake for `base_convert`. However, if you're working with very large numbers, `base_convert` is not a good option.