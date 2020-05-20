---
layout: blog-single
title: "Magento's Not Sane Google reCAPTCHA v3 Implementation"
date: May 19, 2020
image: /img/blog/magento-recaptcha-v3/magento-recaptcha-types@2x.png
tags: [Magento, Security]
related_posts:
- "Magento 2.3.5 + Content Security Policy (CSP): A Fool's Errand"
- "Magento's Not Sane AdminNotification Module"
- "Magento 2 Elasticsearch Cheatsheet"
---

[Magento's out of box Google reCAPTCHA implementation](https://docs.magento.com/m2/ce/user_guide/stores/security-google-recaptcha.html) currently allows the merchant to select between three types:

- Invisible reCaptcha v3
- Invisible reCaptcha v2
- reCaptcha v2

<img
  class="rounded shadow"
  src="/img/blog/magento-recaptcha-v3/magento-recaptcha-types@1x.png"
  srcset="/img/blog/magento-recaptcha-v3/magento-recaptcha-types@1x.png 1x, /img/blog/magento-recaptcha-v3/magento-recaptcha-types@2x.png 2x"
  alt="Screenshot showing reCAPTCHA type dropdown in Magento admin panel">

[The default is currently Invisible reCaptcha v3](https://github.com/magento/magespecialist_ReCaptcha/blob/2.2.3/etc/config.xml#L27). Unfortunately, as we'll see in this post, Magento's reCAPTCHA v3 implementation is not sane and I would not recommend any merchants use it.

Let me elaborate.

<!-- excerpt_separator -->

### How Each Type Works

It's important to understand how each of these reCAPTCHA types work. 

#### reCaptcha v2

"reCaptcha v2" refers to the implementation Google calls ["I'm not a robot" Checkbox](https://developers.google.com/recaptcha/docs/versions#recaptcha_v2_im_not_a_robot_checkbox).

<img
  class="rounded shadow"
  src="/img/blog/magento-recaptcha-v3/magento-recaptcha-v2@1x.png"
  srcset="/img/blog/magento-recaptcha-v3/magento-recaptcha-v2@1x.png 1x, /img/blog/magento-recaptcha-v3/magento-recaptcha-v2@2x.png 2x"
  alt="Screenshot showing reCAPTCHA v2 on frontend login form">

The user must check a box when filling out the form. If Google assesses that the user appears credible (based on this interaction) it will allow the form submission to proceed. However, if Google views the interaction as suspicious, the user will be presented a challenge (e.g. select all the images with buses). Once the challenge has been solved the form will be submitted.

In either case, Google will append a token to the form submission which Magento will validate on the backend (see: [Verifying the user's response](https://developers.google.com/recaptcha/docs/verify)).

#### Invisible reCaptcha v2

"Invisible reCaptcha v2" refers to the implementation Google calls ["Invisible reCAPTCHA badge"](https://developers.google.com/recaptcha/docs/versions#recaptcha_v2_invisible_recaptcha_badge)

<img
  class="rounded shadow"
  src="/img/blog/magento-recaptcha-v3/magento-recaptcha-v2-invisible@1x.png"
  srcset="/img/blog/magento-recaptcha-v3/magento-recaptcha-v2-invisible@1x.png 1x, /img/blog/magento-recaptcha-v3/magento-recaptcha-v2-invisible@2x.png 2x"
  alt="Screenshot showing Invisible reCAPTCHA v2 on frontend login form">

No checkbox is presented to the user. When the form is submitted the same thing will happen as with reCaptcha v2. If Google assesses the traffic to be legitimate it will proceed uninterrupted. However  if Google assesses the user as suspicious, they will be presented with a challenge (again, one of those puzzles to solve). Once solved the form submission will be allowed to proceed and the token can be validated on the server.

*I recommend using Invisible reCAPTCHA v2 for Magento.*

#### reCaptcha v3

At first glance, [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/versions#recaptcha_v3) appears to be very similar to Invisible reCaptcha v2. However, it actually works entirely differently from either of the v2 reCAPTCHA types.

While it's similar to Invisible reCaptcha v2 in that there's no interaction required by the user to submit the form, **Google will also never present the user with a challenge**. Instead, when the server validates the token it will receive a score from 0.0 to 1.0 of Google's assessed risk for the current user. It is then the website owner's responsibility to decide what action to take based on the score received.

### Some Examples Google Gives For What To Do With The Score

Google provides some [recommendations of what actions to take based on the score's](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score) on their reCAPTCHA v3 guide. Here are a few of them:

- **Login**: 	With low scores, require 2-factor-authentication or email verification to prevent credential stuffing attacks.
- **E-commerce**: Put your real sales ahead of bots and identify risky transactions.

### What Does Magento Do With The Score?

In the case of Magento, if the score is below the configured threshold, the request is simply blocked altogether. You'll note that this is not a recommended action by Google for any use case.

### What's The Problem Here?

The problem is the Google is very much capable of producing false positives (legitimate users flagged as bots). With reCAPTCHA v2 these users still had a chance to prove themselves as legitimate by solving the challenge. However, with Magento's reCAPTCHA v3, a user who is mistakenly flagged as a bot has no recourse and is completely unable to proceed with the desired action.

Google is (understandably) secretive about how the scores are calculated, but the following are a few things that could incorrectly cause users to be flagged as suspicious.

- Not being logged in to a Google account
- Being on a VPN / Tor

Notably, users that are concerned about their privacy are more likely to be incorrectly flagged as bots.

