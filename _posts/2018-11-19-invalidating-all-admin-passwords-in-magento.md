---
layout: blog-single
title:  "Invalidating all Admin Passwords in Magento"
description: Instructions for how to invalidate all Magento admin user passwords
date: November 19, 2018
image: /img/blog/magento-invalidate-all-admin-passwords/admin-password-reset-screen@2x.jpg
tags: [Magento, Security]
---

If you're dealing with a Magento site that has experienced a breach, it's a good idea to reset all admin user passwords.

The easiest way to do this is to run a direct SQL query to update the `password` column in the `admin_user` table to gibberish.

```sql
UPDATE admin_user SET password = '--------';
```

No string will hash to this value, so essentially all the accounts will be locked at this point.

<!-- excerpt_separator -->

Next, each user must go through the admin password reset workflow to reset their password.

<img
  class="rounded shadow"
  src="/img/blog/magento-invalidate-all-admin-passwords/admin-password-reset-screen@1x.jpg"
  srcset="/img/blog/magento-invalidate-all-admin-passwords/admin-password-reset-screen@1x.jpg 1x, /img/blog/magento-invalidate-all-admin-passwords/admin-password-reset-screen@2x.jpg 2x"
  alt="Magento 2's password reset screen.">

[Magento brought the `Enterprise_Pci`module into community in Magento 2](https://github.com/magento/magento2/commit/a54cad00b795db6eb30d3ce0fef796b45847b743), so users will not be able to re-use their old passwords. Unfortunately, if you're still running Magento 1 CE you'll have to instruct users not to re-use their passwords and pray that they listen.


