---
layout: blog-single
title:  "Linux Screen Cheatsheet"
description: A quick reference of useful commands for interacting with the Linux screen utility,
date: April 25, 2018
image: 
tags: [Shell, Tools]
---

There are a few of these, but none have all the answers that I want (e.g. how to scroll back up the terminal while attached to a screen session) or are in a format I like. So, I've prepared my own.

This is a cheatsheet of how to do the things I typically need to do with Linux (unix)'s `screen` command...

<!-- excerpt_separator -->

### Start A New Screen Session

```
$ screen -S [name]
```

Name is just an alias for the screen session so that it can easily be distinguished what's happening in that session when looking at a list of all screen sessions via `screen -ls`.

### Detach From The Current Screen Session

**ctrl-a d**

In order to detach from a screen session hold the control key and press "a". Then press the "d" key.

You'll be back a command prompt like the below after doing so.

```
[detached from 28882.db-dump]
$
```

### List Running Screen Sessions

```
$ screen -ls
```

As mentioned above `screen -ls` will list running screen sessions. Here's a sample of the output

```
$ screen -ls
There are screens on:
	28882.db-dump	(Detached)
	46174.mw-scan	(Detached)
2 Sockets in /var/run/screen/S-mchadwick.
```

### Re-attach to a Screen Session

```
screen -r [name-or-pid]
```

`screen -r` will allow you to re-attach to a running screen session. You can use the id or name of the screen session.

### Scroll up while attached to a screen session

**ctrl-a esc**

While attached to a screen session, hold the control key and press "a". Then press escape. At this point you'll be able to scroll up and down within the screen session.

Press escape again to regain the ability to enter commands.

### Kill the screen session you're currently attached to

**ctrl-a k**

While attached to a screen session, hold the control key and press "a", then press "k". You'll need to then press "y" to confirm you'd really like to kill the screen session.

### Detach a screen from another terminal and attach to it

```
$ screen -d -r [name]
```

You may have to do this if you unexpectedly lost an SSH connection while attached to a screen session. In this case the `screen` session may still think it's connected to that SSH connection (e.g. orphaned). The above command will detach it from that terminal and re-attach it to the current terminal.