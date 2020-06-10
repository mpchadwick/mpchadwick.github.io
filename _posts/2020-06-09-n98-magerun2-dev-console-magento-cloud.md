---
layout: blog-single
title: "Using n98-magerun2 dev:console on Magento Cloud"
date: June 9, 2020
image: 
tags: [Magento]
related_posts:
- "Magento 2.3.5 + Content Security Policy (CSP): A Fool's Errand"
- "Magento's Not Sane AdminNotification Module"
- "Magento 2 Elasticsearch Cheatsheet"
---


[`n98-magerun2`](https://github.com/netz98/n98-magerun2)'s [`dev:console`](https://github.com/netz98/n98-magerun2#interactive-development-console) feature can come in quite handy for debugging production issues. However, if you try to run it on Magento Cloud, you'll get an error due the read only filesystem:

```
$ var/n98-magerun2.phar dev:console

In ErrorHandler.php line 61:

  User Notice: Writing to /app/<<REDACTED>>/.config/psysh is not allowed. in phar:///app/<<REDACTED>>/var/n98-magerun2.phar/vendor/psy/psysh/src/ConfigPaths.php on line 228


dev:console [-a|--area AREA] [-h|--help] [-q|--quiet] [-v|vv|vvv|--verbose] [-V|--version] [--ansi] [--no-ansi] [-n|--no-interaction] [--root-dir [ROOT-DIR]] [--skip-config] [--skip-root-check] [--skip-core-commands [SKIP-CORE-COMMANDS]] [--] <command> [<cmd>]
```
{:.wrap}

<!-- excerpt_separator -->

This issue can be resolved by using the `XDG_CONFIG_HOME` environment variable as documented in [this GitHub issue](https://github.com/bobthecow/psysh/issues/382#issuecomment-419955302).

Since `~/var` is writable on Magento Cloud we can use that.

```
$ XDG_CONFIG_HOME=~/var/ var/n98-magerun2.phar dev:console
Magento 2.3.3 Enterprise initialized ✔
At the prompt, type help for some help.

To exit the shell, type ^D.
Psy Shell v0.9.12 (PHP 7.3.12 — cli) by Justin Hileman
New version is available (current: v0.9.12, latest: v0.10.4)
>>>
```

This allows us to use `dev:console` on Magento Cloud.
