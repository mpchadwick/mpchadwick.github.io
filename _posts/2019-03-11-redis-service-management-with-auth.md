---
layout: blog-single
title:  "Redis Service Management with requirepass AUTH enabled"
description: "How the Redis service can be managed when AUTH password is required"
date: March 11, 2019
image:
tags: [Shell, Redis]
---

While reviewing a plan to introduce requirepass AUTH to a Redis instance prepared by a co-worker I came across the following note:

> Will *not* set up init scripts, as starting/stopping Redis with AUTH directive enabled requires password

This didn't smell right to me, so I decided to take a look at the issue with my co-worker.

<!-- excerpt_separator -->

Upon inspection I saw he was using [this](https://gist.github.com/drfeelngood/1120451/c9df332f3656cf703666ac921dae39cdde1d2fb6) init script.

The `stop()` function looked like this:

```bash
stop()
{
    if [ ! -f $PIDFILE ]; then
        ret=1
        echo "$PIDFILE does not exist."
        action $"Stopping $prog: " /bin/false
    else
        PID=`cat "$PIDFILE" 2>/dev/null`
        if [ -n $PID ]; then 
            $CLIEXE -p $PORT shutdown
            ret=$?
            if [ $ret -eq 0 ]; then
                while [ -x /prod/${PID} ]; do
                    echo -n "."
                    sleep 1
                done
                action $"Stopping $prog: " /bin/true
            else
                ret=1
                action $"Stopping $prog: " /bin/false
            fi
        else
            ret=1
            action $"Stopping $prod: " /bin/false
        fi
    fi
    
    return $ret
}
```


I quickly saw this issue in this line

```
$CLIEXE -p $PORT shutdown
```

`$CLIEXE` is `/usr/local/bin/redis-cli`...so this function would stop redis by running `redis-cli shutdown`. This would require the password as the command would be issued through `redis-cli`.

There are a few options for getting around this:

1. You can use the `-a` flag when executing `redis-cli` to provide the password.
2. Instead of using `redis-cli` shutdown, you can simply `kill` the process

Package managers often place a script in `/usr/libexec/redis-shutdown` which elegantly handles this by parsing the configuration file to condtionally supply the password. Here's an abbreviated version:

```bash
PASS=`awk '/^[[:blank:]]*requirepass/ { print $2 }' $CONFIG_FILE | tail -n1`
[ -z "$PASS"  ] || ADDITIONAL_PARAMS="-a $PASS"
$REDIS_CLI -h $HOST -p $PORT $ADDITIONAL_PARAMS shutdown
```