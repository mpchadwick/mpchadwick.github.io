---
layout: blog-single
title:  Debugging With Redis MONITOR
description: A quick look at Redis' MONITOR command, and how it can be used for debugging.
date: October 12, 2017
image:
tags: [Debugging]
---

Today I learned about [the Redis `MONITOR` command](https://redis.io/commands/monitor). Running it is  basically like `tail -f`-ing Redis...it prints every command issued against the Redis instance, kind of like [`varnishncsa`](https://varnish-cache.org/docs/trunk/reference/varnishncsa.html).

Per the docs...

> MONITOR is a debugging command that streams back every command processed by the Redis server
> 
> [https://redis.io/commands/monitor](https://redis.io/commands/monitor)

<!-- excerpt_separator -->

When you run it you'll see something like this...

```
$ redis-cli monitor
1339518083.107412 [0 127.0.0.1:60866] "keys" "*"
1339518087.877697 [0 127.0.0.1:60866] "dbsize"
1339518090.420270 [0 127.0.0.1:60866] "set" "x" "6"
1339518096.506257 [0 127.0.0.1:60866] "get" "x"
1339518099.363765 [0 127.0.0.1:60866] "del" "x"
1339518100.544926 [0 127.0.0.1:60866] "get" "x"
```

The columns are as follows

- `1339518083.107412` - Timestamp
- `0` - Database
- `127.0.0.1:60866` - client IP and port
- ` "get" "x"` - Command

`MONITOR` was invaluable in helping me debug an issue today. That being said, it's probably not something you want to have running at all times...

> Running a single MONITOR client can reduce the throughput by more than 50%. Running more MONITOR clients will reduce throughput even more.
> 
> [https://redis.io/commands/monitor](https://redis.io/commands/monitor)

Happy debugging!