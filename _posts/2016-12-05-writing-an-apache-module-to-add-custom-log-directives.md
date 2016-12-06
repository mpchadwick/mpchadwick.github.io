---
layout: blog-single
title: Writing An Apache Module To Add Custom "%" Directives
description: A guide on writing a custom Apache module which adds a % directive to record request header size.
date: December 05, 2016
image:
tags: [servers, apache, c]
ad: domain-clamp-ad-b.html
---

[`mod_log_config`](http://httpd.apache.org/docs/current/mod/mod_log_config.html)  provides many useful ["%" directives](http://httpd.apache.org/docs/current/mod/mod_log_config.html#formats) for defining  `CustomLog` formats. In combination with its friend, [`mod_logio`](http://httpd.apache.org/docs/2.4/mod/mod_logio.html), 99% percent of logging use cases are covered. However, one day, you may find that there's something you want to log that is not accessible with the tools Apache provides you. Luckily, you can utilize [Apache's module system](https://httpd.apache.org/docs/2.4/developer/modguide.html) to add your own logging directives. In this post guide, we'll write an Apache module that adds a `%^IH` % directive which records request header size, in bytes.

<!-- excerpt_separator -->

### Scaffolding The Module

Per [the official Apache module development guide](https://httpd.apache.org/docs/2.4/developer/modguide.html), all modules use the same boilerplate code to register themselves. We will call our module `log_header_size`. Put the following code into a file called `mod_log_header_size.c`

```c
#include "apr_strings.h"
#include "apr_lib.h"
#include "apr_hash.h"
#include "apr_optional.h"

#define APR_WANT_STRFUNC
#include "apr_want.h"

#include "ap_config.h"
#include "mod_log_config.h"
#include "httpd.h"
#include "http_core.h"
#include "http_config.h"
#include "http_connection.h"
#include "http_protocol.h"

AP_DECLARE_MODULE(log_header_size) =
{
    STANDARD20_MODULE_STUFF,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
};
```

At this point let's compile our module with [`apxs`](https://httpd.apache.org/docs/current/programs/apxs.html). Run the following command...

```
sudo apxs -i -a -c mod_log_header_size.c
```

> **NOTE:** I ran into [this issue](http://apple.stackexchange.com/questions/58186/how-to-compile-mod-wsgi-mod-fastcgi-etc-on-mountain-lion-mavericks-by-fixing) running `apxs` on my MacBook Pro.

Congratulations, you have created your first Apache module!

### Registering The % Directive

[The source code for `mod_logio`](https://github.com/apache/httpd/blob/trunk/modules/loggers/mod_logio.c) is a useful example to learn how to register a % directive. Specifically, we can see the directives registered in the `logio_pre_config` function...

```c
static int logio_pre_config(apr_pool_t *p, apr_pool_t *plog, apr_pool_t *ptemp)
{
    static APR_OPTIONAL_FN_TYPE(ap_register_log_handler) *log_pfn_register;

    log_pfn_register = APR_RETRIEVE_OPTIONAL_FN(ap_register_log_handler);

    if (log_pfn_register) {
        log_pfn_register(p, "I", log_bytes_in, 0);
        log_pfn_register(p, "O", log_bytes_out, 0);
        log_pfn_register(p, "S", log_bytes_combined, 0);
        log_pfn_register(p, "^FB", log_ttfb, 0);
    }

    return OK;
}
```

In this (abbreviated) code snippet, we can see that this function is [hooked](https://httpd.apache.org/docs/2.4/developer/modguide.html#hooking) into the `ap_hook_pre_config ` hook.

```c
static void register_hooks(apr_pool_t *p)
{
    ap_hook_pre_config(logio_pre_config, NULL, NULL, APR_HOOK_REALLY_FIRST);
}
```

The registered "%" directives call then these functions to retrieve the values...

```c
static const char *log_bytes_in(request_rec *r, char *a)
{
    logio_config_t *cf = ap_get_module_config(r->connection->conn_config,
                                              &logio_module);

    return apr_off_t_toa(r->pool, cf->bytes_in);
}

static const char *log_bytes_out(request_rec *r, char *a)
{
    logio_config_t *cf = ap_get_module_config(r->connection->conn_config,
                                              &logio_module);

    return apr_off_t_toa(r->pool, cf->bytes_out);
}

static const char *log_bytes_combined(request_rec *r, char *a)
{
    logio_config_t *cf = ap_get_module_config(r->connection->conn_config,
                                              &logio_module);

    return apr_off_t_toa(r->pool, cf->bytes_out + cf->bytes_in);
}

static const char *log_ttfb(request_rec *r, char *a)
{
    logio_req_t *rconf = ap_get_module_config(r->request_config,
                                           &logio_module);

    if (!rconf || !rconf->ttfb) { 
        return "-";
    }

    return apr_psprintf(r->pool, "%" APR_TIME_T_FMT, rconf->ttfb);
}
```

### Stubbing The Value For Our Directive

Now that we've taken a quick look at the `mod_logio` source code, let's update `mod_log_header_size.c`. At this point we'll just register the `%HI` % directive and stub the value. 

First we need to update our module directive to tell to it that we want to register hooks.

```c
AP_DECLARE_MODULE(log_header_size) =
{
    STANDARD20_MODULE_STUFF,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    register_hooks
};
```

Just as `mod_logio` does, we want to hook into `ap_hook_pre_config`. Our `register_hooks` function looks like this...

```c
static void register_hooks(apr_pool_t *p)
{
    ap_hook_pre_config(log_header_size_pre_config, NULL, NULL, APR_HOOK_REALLY_FIRST);
}
```

`log_header_size_pre_config` also looks very similar to `logio_pre_config `.

```c
static int log_header_size_pre_config(apr_pool_t *p, apr_pool_t *plog, apr_pool_t *ptemp)
{
    static APR_OPTIONAL_FN_TYPE(ap_register_log_handler) *log_pfn_register;

    log_pfn_register = APR_RETRIEVE_OPTIONAL_FN(ap_register_log_handler);

    if (log_pfn_register) {
        log_pfn_register(p, "^IH", log_bytes_in_header, 0);
    }

    return OK;
}
```

Finally, we'll stub out the value in `log_bytes_in_header`.

```c
static const char *log_bytes_in_header(request_rec *r, char *a)
{
    return "Hello";
}
```

At this point, `mod_log_header_size.c` should look like this...

```c
#include "apr_strings.h"
#include "apr_lib.h"
#include "apr_hash.h"
#include "apr_optional.h"

#define APR_WANT_STRFUNC
#include "apr_want.h"

#include "ap_config.h"
#include "mod_log_config.h"
#include "httpd.h"
#include "http_core.h"
#include "http_config.h"
#include "http_connection.h"
#include "http_protocol.h"

static const char *log_bytes_in_header(request_rec *r, char *a)
{
    return "Hello";
}

static int log_header_size_pre_config(apr_pool_t *p, apr_pool_t *plog, apr_pool_t *ptemp)
{
    static APR_OPTIONAL_FN_TYPE(ap_register_log_handler) *log_pfn_register;

    log_pfn_register = APR_RETRIEVE_OPTIONAL_FN(ap_register_log_handler);

    if (log_pfn_register) {
        log_pfn_register(p, "^IH", log_bytes_in_header, 0);
    }

    return OK;
}

static void register_hooks(apr_pool_t *p)
{
    ap_hook_pre_config(log_header_size_pre_config, NULL, NULL, APR_HOOK_REALLY_FIRST);
}

AP_DECLARE_MODULE(log_header_size) =
{
    STANDARD20_MODULE_STUFF,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    register_hooks
};
```

Let's go ahead and compile it.

```
sudo apxs -i -a -c mod_log_header_size.c
```

You should now be able to add `%^IH` to a `LogFormat` string and see "Example" added to the logs.

### Actually Getting The Request Header Size

In order to actually get the request header size we'll take a look at the source code of another Apache module, [`mod_log_forensic`](https://httpd.apache.org/docs/2.4/mod/mod_log_forensic.html). This module records the *entire* request headers to a log file for each request (it does a little more than that, feel free to read [the documentation](https://httpd.apache.org/docs/2.4/mod/mod_log_forensic.html) if you're interested). The function is interest of `log_before` which uses `apr_table_do` to iterate through each of the request headers. Here's an abbreviated version...

```c
static int log_before(request_rec *r)
{
    hlog h;

    apr_table_do(log_headers, &h, r->headers_in, NULL);

    return OK;
}
```

`apr_table_do` calls `log_headers` for each header in the `apr_table_t`. `apr_table`s are documented [here](http://apr.apache.org/docs/apr/1.5/group__apr__tables.html). 

`mod_log_forsensic` hooks this into `ap_hook_post_read_request`.

```c
static void register_hooks(apr_pool_t *p)
{
    static const char * const pre[] = { "mod_unique_id.c", NULL };
    ap_hook_post_read_request(log_before,pre,NULL,APR_HOOK_REALLY_FIRST);
}
```

We will combine this technique with `mod_logio`s strategy for managing the % directives value in our implementation.

### The Implementation

First, similar to `mod_logio` we will define a new type to wrap our data. At the top of `mod_log_header_size.c` add the following.

```c
typedef struct log_header_size_config_t {
    apr_off_t bytes_in_header;
} log_header_size_config_t;
```

Per `mod_logio` we also need to add the following line at the top.

```c
module AP_MODULE_DECLARE_DATA log_header_size_module;
```

Just like `mod_logio` we then hook into `ap_hook_pre_connection ` and register an instance of the `log_header_size_config_t ` struct which we will access through our module.

Add the following line to register hooks.

```c
ap_hook_pre_connection(log_header_size_pre_connection, NULL, NULL, APR_HOOK_MIDDLE);
```

Then, define the function.

```c
static int log_header_size_pre_connection(conn_rec *c, void *csd)
{
    log_header_size_config_t *cf = apr_palloc(c->pool, sizeof(*cf));

    ap_set_module_config(c->conn_config, &log_header_size_module, cf);

    return OK;
}
```

At this point, `mod_log_header_size.c` should look like this.

```c
#include "apr_strings.h"
#include "apr_lib.h"
#include "apr_hash.h"
#include "apr_optional.h"

#define APR_WANT_STRFUNC
#include "apr_want.h"

#include "ap_config.h"
#include "mod_log_config.h"
#include "httpd.h"
#include "http_core.h"
#include "http_config.h"
#include "http_connection.h"
#include "http_protocol.h"

module AP_MODULE_DECLARE_DATA log_header_size_module;

typedef struct log_header_size_config_t {
    apr_off_t bytes_in_header;
} log_header_size_config_t;

static const char *log_bytes_in_header(request_rec *r, char *a)
{
    return "Hello";
}

static int log_header_size_pre_connection(conn_rec *c, void *csd)
{
    log_header_size_config_t *cf = apr_palloc(c->pool, sizeof(*cf));

    ap_set_module_config(c->conn_config, &log_header_size_module, cf);

    return OK;
}

static int log_header_size_pre_config(apr_pool_t *p, apr_pool_t *plog, apr_pool_t *ptemp)
{
    static APR_OPTIONAL_FN_TYPE(ap_register_log_handler) *log_pfn_register;

    log_pfn_register = APR_RETRIEVE_OPTIONAL_FN(ap_register_log_handler);

    if (log_pfn_register) {
        log_pfn_register(p, "^IH", log_bytes_in_header, 0);
    }

    return OK;
}

static void register_hooks(apr_pool_t *p)
{
    ap_hook_pre_connection(log_header_size_pre_connection, NULL, NULL, APR_HOOK_MIDDLE);
    ap_hook_pre_config(log_header_size_pre_config, NULL, NULL, APR_HOOK_REALLY_FIRST);
}

AP_DECLARE_MODULE(log_header_size) =
{
    STANDARD20_MODULE_STUFF,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    register_hooks
};
```

When compiled, it will behave exactly the same as it did before making any of these changes.

### Actually Sending Back The Request Header Size

Next, we need to take what we learned from `mod_log_forensic` to update our `log_header_size_config_t` with the actual request header size. First lets hook into `ap_hook_post_read_request `.


```c
ap_hook_post_read_request(log_header_size_post_read_request, NULL, NULL, APR_HOOK_REALLY_FIRST);
```

`log_header_size_post_read_request` will use `apr_table_do` as we saw in `mod_log_forensic`.

```c
static int log_header_size_post_read_request(request_rec *r)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);
    apr_table_do(gather_header_size, &cf->bytes_in_header, r->headers_in, NULL);

    return OK;
}
```

Then, `gather_header_size` will update `log_header_size_config_t ` with the size of key and value for each header.


```c
static int gather_header_size(void *b_, const char *key, const char *value)
{
    int *b = b_;
    (*b) += strlen(key);
    (*b) += strlen(value);

    return 1;
}
```

Now we can replace the stub response in `log_bytes_in_header`.

```c
static const char *log_bytes_in_header(request_rec *r, char *a)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);

    return apr_off_t_toa(r->pool, cf->bytes_in_header);
}
```

At this point our `mod_log_header_size.c` looks like this.

```c
#include "apr_strings.h"
#include "apr_lib.h"
#include "apr_hash.h"
#include "apr_optional.h"

#define APR_WANT_STRFUNC
#include "apr_want.h"

#include "ap_config.h"
#include "mod_log_config.h"
#include "httpd.h"
#include "http_core.h"
#include "http_config.h"
#include "http_connection.h"
#include "http_protocol.h"

module AP_MODULE_DECLARE_DATA log_header_size_module;

typedef struct log_header_size_config_t {
    apr_off_t bytes_in_header;
} log_header_size_config_t;

static const char *log_bytes_in_header(request_rec *r, char *a)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);

    return apr_off_t_toa(r->pool, cf->bytes_in_header);
}

static int gather_header_size(void *b_, const char *key, const char *value)
{
    int *b = b_;
    (*b) += strlen(key);
    (*b) += strlen(value);

    return 1;
}

static int log_header_size_post_read_request(request_rec *r)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);
    apr_table_do(gather_header_size, &cf->bytes_in_header, r->headers_in, NULL);

    return OK;
}

static int log_header_size_pre_connection(conn_rec *c, void *csd)
{
    log_header_size_config_t *cf = apr_palloc(c->pool, sizeof(*cf));

    ap_set_module_config(c->conn_config, &log_header_size_module, cf);

    return OK;
}

static int log_header_size_pre_config(apr_pool_t *p, apr_pool_t *plog, apr_pool_t *ptemp)
{
    static APR_OPTIONAL_FN_TYPE(ap_register_log_handler) *log_pfn_register;

    log_pfn_register = APR_RETRIEVE_OPTIONAL_FN(ap_register_log_handler);

    if (log_pfn_register) {
        log_pfn_register(p, "^IH", log_bytes_in_header, 0);
    }

    return OK;
}

static void register_hooks(apr_pool_t *p)
{
    ap_hook_pre_connection(log_header_size_pre_connection, NULL, NULL, APR_HOOK_MIDDLE);
    ap_hook_pre_config(log_header_size_pre_config, NULL, NULL, APR_HOOK_REALLY_FIRST);
    ap_hook_post_read_request(log_header_size_post_read_request, NULL, NULL, APR_HOOK_REALLY_FIRST);
}

AP_DECLARE_MODULE(log_header_size) =
{
    STANDARD20_MODULE_STUFF,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    register_hooks
};
```

Try compiling it.

### Wait, What?

If you're testing things out at this point, you'll notice something strange. The values aren't correct AND they just keep going up! This is because, per `mod_logio` we need to clean up after ourselves.

In order to do so, we hook into `ap_hook_log_transaction `.

```c
ap_hook_log_transaction(log_header_size_log_transaction, NULL, NULL, APR_HOOK_MIDDLE);
```

`log_header_size_log_transaction ` just cleans up our `log_header_size_config_t `.

```c
static int log_header_size_log_transaction(request_rec *r)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);
    cf->bytes_in_header = 0;

    return OK;
}
```

Putting it **all** together, we have this.

```c
#include "apr_strings.h"
#include "apr_lib.h"
#include "apr_hash.h"
#include "apr_optional.h"

#define APR_WANT_STRFUNC
#include "apr_want.h"

#include "ap_config.h"
#include "mod_log_config.h"
#include "httpd.h"
#include "http_core.h"
#include "http_config.h"
#include "http_connection.h"
#include "http_protocol.h"

module AP_MODULE_DECLARE_DATA log_header_size_module;

typedef struct log_header_size_config_t {
    apr_off_t bytes_in_header;
} log_header_size_config_t;

static const char *log_bytes_in_header(request_rec *r, char *a)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);

    return apr_off_t_toa(r->pool, cf->bytes_in_header);
}

static int gather_header_size(void *b_, const char *key, const char *value)
{
    int *b = b_;
    (*b) += strlen(key);
    (*b) += strlen(value);

    return 1;
}

static int log_header_size_post_read_request(request_rec *r)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);
    apr_table_do(gather_header_size, &cf->bytes_in_header, r->headers_in, NULL);

    return OK;
}

static int log_header_size_pre_connection(conn_rec *c, void *csd)
{
    log_header_size_config_t *cf = apr_palloc(c->pool, sizeof(*cf));

    ap_set_module_config(c->conn_config, &log_header_size_module, cf);

    return OK;
}

static int log_header_size_pre_config(apr_pool_t *p, apr_pool_t *plog, apr_pool_t *ptemp)
{
    static APR_OPTIONAL_FN_TYPE(ap_register_log_handler) *log_pfn_register;

    log_pfn_register = APR_RETRIEVE_OPTIONAL_FN(ap_register_log_handler);

    if (log_pfn_register) {
        log_pfn_register(p, "^IH", log_bytes_in_header, 0);
    }

    return OK;
}

static int log_header_size_log_transaction(request_rec *r)
{
    log_header_size_config_t *cf = ap_get_module_config(r->connection->conn_config, &log_header_size_module);
    cf->bytes_in_header = 0;

    return OK;
}

static void register_hooks(apr_pool_t *p)
{
    ap_hook_pre_connection(log_header_size_pre_connection, NULL, NULL, APR_HOOK_MIDDLE);
    ap_hook_pre_config(log_header_size_pre_config, NULL, NULL, APR_HOOK_REALLY_FIRST);
    ap_hook_post_read_request(log_header_size_post_read_request, NULL, NULL, APR_HOOK_REALLY_FIRST);
    ap_hook_log_transaction(log_header_size_log_transaction, NULL, NULL, APR_HOOK_MIDDLE);
}

AP_DECLARE_MODULE(log_header_size) =
{
    STANDARD20_MODULE_STUFF,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    register_hooks
};
```

Go ahead and compile that and check your logs. It should be working perfectly!

### Conclusion

I hope this guide provided a useful example of how Apache modules can be written to create custom % directives. I've published the code to Github [here](https://github.com/mpchadwick/mod_log_header_size).

I don't claim to be an expert in C by any means, so corrections are comments as certainly appreciated. Feel free to drop a note comments below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
