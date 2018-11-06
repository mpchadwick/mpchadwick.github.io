---
layout: blog-single
title:  "cURL error 77 with PHP-FPM after yum&nbsp;update"
description: Blow-by-blow of my debugging an issue where curl looks failed, but only when executed via PHP-FPM
date: November 05, 2018
image:
tags: [PHP, Debugging]
---

Recently a client reported that checkout was broken on their ecommerce website.

After some quick investigation, I found that the application code responsible for speaking with the payment gateway was logging the following error:

```
CURL Connection error:  (77)
```

Here, I'll outline my approach to solving this problem.

<!-- excerpt_separator -->

### Hitting the Payment Gateway's endpoint using the `curl` Executable

The site was using was Authorize.NET as its payment gateway. The code was specifically hitting an endpoint at `https://api2.authorize.net`. I tried hitting the endpoint myself using the `curl` executable while SSH-ed into one of their web servers to see if the issue would reproduce...

```
$ curl https://api2.authorize.net/xml/v1/request.api
{"messages":{"resultCode":"Error","message":[{"code":"E00003","text":"Root element is missing."}]}}
```

No cURL error 77...the problem did not seem to reproduce...

### Invoking cURL through PHP-FPM

The application code, of course, wasn't running curl via command line invocation of the `curl` executable. Instead, a PHP-FPM process was executing a script that was using [PHP cURL functions](http://php.net/manual/en/ref.curl.php).

As such as decided to test that way. I quickly created a testing script...

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api2.authorize.net");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$output = curl_exec($ch);
var_dump($output) . PHP_EOL;
var_dump(curl_error($ch)) . PHP_EOL;
var_dump(curl_errno($ch)) . PHP_EOL;
```

I put it in the webroot of the server I was SSH-ed into and ran it via a PHP-FPM process as follows:

```
$ curl --resolve www.example.com:80:127.0.0.1 http://www.example.com/mpc-curl-auth-net-test.php
bool(false)
string(0) ""
int(77)
```

Bingo, I got the error.

### What Had Changed Recently?

This reminded me of [an issue I had seen not long ago](https://twitter.com/maxpchadwick/status/994954183861207043) where DNS lookups failed only when running curl via a script executed by PHP-FPM. In that case I had tracked it back to a yum update. 

As such, I decided to check `/var/log/yum.log` to see if any packages had been update recently....

```
Oct 24 03:53:38 Updated: nspr.x86_64 4.19.0-1.43.amzn1
Oct 24 03:53:39 Updated: nss-util.x86_64 3.36.0-1.54.amzn1
Oct 24 03:53:39 Updated: nss-softokn-freebl.x86_64 3.36.0-5.42.amzn1
Oct 24 03:53:39 Updated: nss-softokn.x86_64 3.36.0-5.42.amzn1
Oct 24 03:53:39 Updated: nss-sysinit.x86_64 3.36.0-5.82.amzn1
Oct 24 03:53:39 Updated: nss.x86_64 3.36.0-5.82.amzn1
Oct 24 03:53:39 Updated: nss-tools.x86_64 3.36.0-5.82.amzn1
Oct 24 03:53:39 Updated: python26-paramiko.noarch 1.15.1-2.7.amzn1
Oct 24 03:53:39 Updated: python27-paramiko.noarch 1.15.1-2.7.amzn1
```

Bingo again! A yum update had run the night before...

### The Fix

Going off my experience with the DNS issue, I guessed that restarting php-fpm might fix the issue. As such, I decided to give it a try...

```
$ sudo service php-fpm restart
```

Then, I re-ran my testing script

```
$ curl --resolve www.example.com:80:127.0.0.1 http://www.example.com/mpc-curl-auth-net-test.php
string(1233) "<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/>
<title>403 - Forbidden: Access is denied.</title>
...
"
string(0) ""
int(0)
```

:boom:

Issue resolved.

### The Return Of The Issue

This project was running a fleet of AWS EC2 instances and we manually restarted php-fpm across all. However, later that same day the client reported the issue had reared its ugly head again. This time, however it was only occurring sporadicly. 

Digging in, I found this was due a fresh EC2 instance being introducing into the [auto scaling group](https://docs.aws.amazon.com/autoscaling/ec2/userguide/AutoScalingGroup.html).

What was happening was...

- Instance comes online with old NSS packages
- PHP-FPM starts
- yum update runs
- Bad times :frowning:

In order to fix this we baked a new [AMI](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html) with the NSS packages already updated. Now, when a new EC2 instance came online this would happen...

- Instance comes online with new NSS packages
- PHP-FPM starts
- :v:

### The True Root Cause

While I would love to know exactly why updating those packages caused the error when running curl via PHP-FPM unfortunately I didn't have the opportunity to truly get to the bottom of it. If you've run into this same issue and went deeper on it than I did I'd love to hear about it in the comments below...