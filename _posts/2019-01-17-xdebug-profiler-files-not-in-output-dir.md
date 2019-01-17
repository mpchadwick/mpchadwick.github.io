---
layout: blog-single
title:  "Xdebug Profiler Files Not In xdebug.profiler_output_dir"
description: Simple solution for finding Xdebug profiler files that aren't in the expected directory
date: January 17, 2019
image:
tags: [PHP]
---

Something that's tripped up both myself and devs that I've worked with is not finding Xdebug profiler files in the expected directory (`/tmp` by default).

It usually goes something like this...

- Enable the Xdebug profiler by adding `xdebug.profiler_enable_trigger = 1` to a `.ini` file.
- Make a request with `?XDEBUG_PROFILE =1` in the GET string.
- Check for the output file in `/tmp`
- Pull out hair because it's not there.

This may be accompanied by running a sanity check, only to be accompanied by more hair pulling...

```
$ php -r 'var_dump(ini_get("xdebug.profiler_output_dir"));'
string(4) "/tmp"
```

<!-- excerpt_separator -->

If you find yourself in this situation, the likely cause is that your system is using [PrivateTmp](https://access.redhat.com/blogs/766093/posts/1976243).

In this case the cachegrind file will actually be placed in a folder like this: 

```
/tmp/systemd-private-ff40cf656c534501b9735e4b53c9bcd3-php-fpm.service-4C70G0/tmp/
```

The best way to find the file in this case is as follows:

```
sudo find /tmp/ -name '*cachegrind*'
```