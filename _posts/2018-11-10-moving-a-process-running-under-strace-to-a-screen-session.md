---
layout: blog-single
title:  "Moving a process running under strace to a screen session"
description: My learnings on moving a process running under strace to a screen session
date: November 10, 2018
image:
tags: [Shell, Tools]
---

Today I was in a scenario where I started running a process under `strace` with the hopes of capturing diagnostic information about an error. However, instead of hitting the error, the process began to run succesfully.

It would likely take at least an hour to complete, and I was nervous that I'd lose my SSH connection, causing the process to wind up failing. I was _also_ nervous that if I stopped the process to restart in a screen session, it wouldn't be safe to re-run as it would have partially imported some data at that point.

Here, I'll walk through my findings about moving a process running under `strace` to a `screen` session.

<!-- excerpt_separator -->

### The Standard Approach

[The standard approach](https://www.linkedin.com/pulse/move-running-process-screen-bruce-werdschinski/) for moving a process to a `screen` session is as follows...

1. Use Ctrl-Z to suspend the process
2. Run `bg` to resume the process in the background
3. Run `disown` to remove the process from the current shell's job table
4. Start a `screen` session
5. Use `reptyr` to take over the process in the `screen` session.

I tried following these steps for the parent `strace` process and got the following error...

```
[-] Process 1653 (php) shares 1650's process group. Unable to attach.
(This most commonly means that 1650 has sub-processes).
Unable to attach to pid 1650: Invalid argument
```

### The `-T` Flag

Googling the error brought me to the GitHub issue ["Doesn't work for processes which have spawned subprocesses"](https://github.com/nelhage/reptyr/issues/24) filed against the [nelhage/reptyr](https://github.com/nelhage/reptyr) repository. There I learned the the `-T` flag was added to handle exactly this scenario.

I decided to give it a try...

### Upgrading reptyr

I quickly learned, however, that the version of `reptyr` installed on my system (CentOS 7) did not support the `-T` flag. I would need to clone the [`nelhage/reptyr`](https://github.com/nelhage/reptyr) repository and build from source.

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: While I didn't personally test this, GitHub user <a href="https://github.com/Smattr">Smattr</a> provides instructions to build reptyr without sudo permissions <a href="https://github.com/nelhage/reptyr/issues/24#issuecomment-302996163">here</a>.</p>
</div> 

### Permissions Issues

Once I had a version of `reptyr` installed that supported the `-T` flag I tried again. This time I ran into another issue.

```
Unable to attach to pid 1650: Operation not permitted
```

Not exactly sure the details on this, but `strace` didn't seem to want to allow me to use `reptyr`.

### Trying sudo

My next step was to try to `reptyr` with `sudo`. Immediately after running `reptyr` with `sudo` my terminal became unresponsive to any input.

However, when I closed the terminal and opened a new one I could see that both the parent `strace` process and it's child were still running. `reptyr`-ing with `sudo` was successful!

### What About Without sudo

I wanted to take this a step further and see if this was possible without `sudo`. For my use case what we can do is kill the parent `strace` process and then `reptyr` the child PHP process to the `screen` session. [This answer](https://stackoverflow.com/a/18252520/2877224) describes how to kill `strace` without killing the child process. Putting it all together...

1. Ctrl-Z to suspend the strace process
2. `kill -9` the strace PID
3. Start a new screen session
4. `reptyr` to take over the child process in the screen session