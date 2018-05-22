---
layout: blog-single
title:  "Magento 2 Slow Admin&nbsp;Login"
description: My findings investigating an issue where logging in to the Magento admin panel was taking longer than usual
date: May 21, 2018
image: /img/blog/magento-2-admin-login-slow/new-relic-trace@1x.png
tags: [Magento]
---

Recently at [Something Digital](https://www.somethingdigital.com/) we upgraded a client's site to version 2.1.12. Shortly thereafter, we received a report that logging in to the admin panel was taking significantly longer than usual.

Looking in New Relic we could see that the vast majority of the time was being spent reading the session from Redis.

<img
  class="rounded shadow"
  src="/img/blog/magento-2-admin-login-slow/new-relic-trace@1x.png"
  srcset="/img/blog/magento-2-admin-login-slow/new-relic-trace@1x.png 1x, /img/blog/magento-2-admin-login-slow/new-relic-trace@2x.png 2x"
  alt="A screenshot showing a transaction trace of a slow login in New Relic">

<!-- excerpt_separator -->

I did a bit of Googling and landed on the ["Magento 2 Slow Admin Login and Saving Products"](https://magento.stackexchange.com/questions/213865/magento-2-slow-admin-login-and-saving-products) StackExchange question. There I found a link to the following patch...

```diff
From aaa60b1b72bdc189b38492bd50b0ffb23101173e Mon Sep 17 00:00:00 2001
From: Dmytro Horytskyi <dhorytskyi@magento.com>
Date: Wed, 22 Nov 2017 17:35:17 +0200
Subject: [PATCH] MAGETWO-84106: [2.2.1] Implementation (fix) of session
 locking mechanism in php-redis-session-abstract leads to 30 sec timeout

---
 lib/internal/Magento/Framework/Session/SessionManager.php | 12 +-----------
 1 file changed, 1 insertion(+), 11 deletions(-)

diff --git a/lib/internal/Magento/Framework/Session/SessionManager.php b/lib/internal/Magento/Framework/Session/SessionManager.php
index 2cea02fa3b36..272d3d923c8a 100644
--- a/lib/internal/Magento/Framework/Session/SessionManager.php
+++ b/lib/internal/Magento/Framework/Session/SessionManager.php
@@ -504,18 +504,8 @@ public function regenerateId()
             return $this;
         }
 
-        //@see http://php.net/manual/en/function.session-regenerate-id.php#53480 workaround
         if ($this->isSessionExists()) {
-            $oldSessionId = session_id();
-            session_regenerate_id();
-            $newSessionId = session_id();
-            session_id($oldSessionId);
-            session_destroy();
-
-            $oldSession = $_SESSION;
-            session_id($newSessionId);
-            session_start();
-            $_SESSION = $oldSession;
+            session_regenerate_id(true);
         } else {
             session_start();
         }
```

The issue is explained in detail in the GitHub issue ["Admin login always takes >30 sec when using Redis on 2.2.1"](https://github.com/magento/magento2/issues/12385)...

> The `regenerateId` method was recently rewritten to generate a new session id when an admin logs into the admin dashboard.
>
> The change in the session id causes the session read method of the redis session handling class to loop 60 times with a 500 ms sleep at the end of each loop before breaking out while it looks for the locking pid. This is because both `session_regenerate_id` and `session_start` increment the lock value 0->1->2 but only when the value is 1 will it break out otherwise it continues for `$tries` (60) with a 500 ms sleep between each one.

Essentially it's not safe to call both `session_regenerate_id` and `session_start` the way Magento had when using the Redis session handler as it will double lock the session, leading to the session never getting unlocked until the session reader ultimately gives up on trying to obtain the lock.

At the time of writing this the fix is applied to the latest 2.2.X version (2.2.4) but is still not applied to the latest 2.1.X version (2.1.13) despite being backported to 2.1 and [being present in `2.1-develop` on GitHub](https://github.com/magento/magento2/commit/86f25a5db07031635ff587006bfe974cb10eeba2).


