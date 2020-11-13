---
title: dbanon
position: 25
selected: true
languages: Go
description: A run-anywhere, dependency-less database anonymizer.
view_url: https://github.com/mpchadwick/dbanon
call_to_action: View on GitHub
---

`dbanon` is a flexible, fast, dependency-less database anonymizer. I created it after researching available database anoymizers for Magento and not finding anything that worked to my liking (more details on that in [this Twitter thread](https://twitter.com/maxpchadwick/status/1109217533528285184)).

`dbanon` accepts a database dump via `stdin`, rewrites and anoymizes the text on the fly and sends the output back to `stdout`. As it's written in go, it will run anywhere, including database servers that don't have scripting languages like PHP installed. It is immediately compatible with Magento 2 out-of-the-box, but supports custom configurations to run it in any environment.