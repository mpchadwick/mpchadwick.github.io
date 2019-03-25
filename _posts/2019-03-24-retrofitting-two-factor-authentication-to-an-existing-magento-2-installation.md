---
layout: blog-single
title:  "Retrofitting Two Factor Authentication To An Existing Magento 2 Installation"
description: "How to _properly_ set up forced two-factor on an existing Magento installation"
date: March 24, 2019
image: /img/blog/retrofit-2fa/magento-google-authenticator-2fa-setup-screen@2x.png
tags: [Magento, Security]
---

Enabling forced two-factor authentication for the Magento admin panel is a great way to improve security. However, with the current mechanics of [Magento's two-factor authentication module](https://github.com/magento/magespecialist_TwoFactorAuth) simply flipping the switch in your stores admin panel still leaves a gap in your system's security.

<!-- excerpt_separator -->

The reason for this is that even after you've enabled two-factor authentication all existing credentials can still be used to fully authenticate on the system for the first time. Once the user has provided the user name and the password they will not be prompted to provide a second factor. Instead, they'll be prompted to setup their account for two-factor authentication.

<img
  class="rounded shadow"
  src="/img/blog/retrofit-2fa/magento-google-authenticator-2fa-setup-screen@1x.png"
  srcset="/img/blog/retrofit-2fa/magento-google-authenticator-2fa-setup-screen@1x.png 1x, /img/blog/retrofit-2fa/magento-google-authenticator-2fa-setup-screen@2x.png 2x"
  alt="Screenshot showing Magento's 2FA Google Authenticator setup screen">

After completing two-factor authentication setup, they'll have access to the admin panel.

As such, if the system has a "stale" account that is not actively used an attacker could still compromise the system by authenticating with a password and then setting up two-factor authentication with their own device.

As such I recommend [invalidating all admin passwords]({{ site.baseurl }}{% link _posts/2018-11-19-invalidating-all-admin-passwords-in-magento.md %}) immediately after enabling two-factor authentication. Users will then need to go through a password reset workflow which requires the user to have access to the email account associated with the Magento admin account -- effectively a second factor.

The two-factor authentication module could be improved by handling this out of box. When a system is set to enforce two-factor authentication, on a user's first login a random token could be sent to the email address on file for the account. The user would then be required to enter that token before allowing them to set up two-factor authentication.