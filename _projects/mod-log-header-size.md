---
title: mod_log_header_size
position: 400
selected: true
languages: C
tags: Monitoring, Logging
description: An Apache module that provides % directives for logging header sizes
view_url: https://github.com/mpchadwick/mod_log_header_size
call_to_action: View on GitHub
---

I built an Apache plugin which adds `%` directives for logging request and response header sizes (in bytes). This was built in response to several issues I've seen where application code leads to header size limits being exceeded on both requests and responses. The module allows users to monitor and alert on header size.
