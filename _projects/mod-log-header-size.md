---
title: mod_log_header_size
position: 400
---

I build an Apache plugin which adds `%` directives for logging request and response header sizes (in bytes). This was built in response to several issues I've seen where application code leads to header size limits being exceeded on both requests and responses. The module allows users to monitor and alert on header size.

<a class="call-to-action" href="https://github.com/mpchadwick/mod_log_header_size">View on GitHub</a>

