---
layout: blog-single
title: Full List of Apache Hooks
description: Apache hooks all the thing!
date: December 07, 2016
image:
tags: [Servers, Apache, C]
ad: none
---

[Apache's hooking system](https://httpd.apache.org/docs/2.4/developer/hooks.html) provides a very convenient way to customize request processing. However, thorough documentation is difficult to track down. [The Apache developer documentation](https://ci.apache.org/projects/httpd/trunk/doxygen/group__hooks.html) refers readers to [the Doxygen documentation](https://ci.apache.org/projects/httpd/trunk/doxygen/group__hooks.html), however that page makes no mention of some commonly used hooks such as `log_header_size_post_read_request`.

<!-- excerpt_separator -->

After much time scouring the web, by chance, while looking through the Apache source code, I stumbled upon [the source code of `mod_example_hooks.c`](http://svn.apache.org/viewvc/httpd/httpd/trunk/modules/examples/mod_example_hooks.c?view=markup). After briefly glancing through the file I quickly realized that I had found the pot of gold at the end of the rainbow that I was looking for. 

At the top of the file you'll see the following line immediately communicating that `mod_example_hooks.c` is the intended to show how hooks are meant to be used.

> It provides demonstrations of how modules do things. It participates in all of the processing phases. 

Then you''ll see function after function documenting how each hook is intended to be used. For example...

```c
/*
 * This routine is called to perform any module-specific log file
 * openings. It is invoked just before the post_config phase
 *
 * The return value is OK, DECLINED, or HTTP_mumble.  If we return OK, the
 * server will still call any remaining modules with an handler for this
 * phase.
 */
static int x_open_logs(apr_pool_t *pconf, apr_pool_t *plog,
                        apr_pool_t *ptemp, server_rec *s)
{
    /*
     * Log the call and exit.
     */
    trace_startup(ptemp, s, NULL, "x_open_logs()");
    return OK;
}
```

And then...

```c
/*
 * This routine is called after the server finishes the configuration
 * process.  At this point the module may review and adjust its configuration
 * settings in relation to one another and report any problems.  On restart,
 * this routine will be called only once, in the running server process.
 *
 * The return value is OK, DECLINED, or HTTP_mumble.  If we return OK, the
 * server will still call any remaining modules with an handler for this
 * phase.
 */
static int x_post_config(apr_pool_t *pconf, apr_pool_t *plog,
                          apr_pool_t *ptemp, server_rec *s)
{
    /*
     * Log the call and exit.
     */
    trace_startup(ptemp, s, NULL, "x_post_config()");
    return OK;
}
```

If you're trying to understand **all** the hooks available to you as an Apache module developer, first and foremost, I highly suggest you read through [the source code of `mod_example_hooks.c`](http://svn.apache.org/viewvc/httpd/httpd/trunk/modules/examples/mod_example_hooks.c?view=markup). It is, by far, the most thorough documentation of Apache hooks that I was able to find.
