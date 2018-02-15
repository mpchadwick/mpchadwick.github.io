---
layout: blog-single
title:  "Add the Current Date to a Filename from the Command&nbsp;Line"
description: A look at options for (sanely) adding the current date to a filename from the command line.
date: February 14, 2018
image: 
tags: [Shell]
---

Something I do very often is add the current date to a filename from the command line.

Historically, I've always done something like this...

```
$ mv foo.txt 2018_02_14_18_07_foo.txt
```

It always felt dirty though...why should I manually type out the current date when I'm sitting in front of a computer which is equally if not more capable of doing that exact thing?

While I long put off researching this, today, I finally turned to Google in hopes of finding a more sane approach. 

<!-- excerpt_separator -->

### Googling

My search quickly brought me to the ["How to append date to backup file"](https://unix.stackexchange.com/questions/96380/how-to-append-date-to-backup-file) Stack Overflow question. There I found the following suggestion...

```
$ touch "foo.backup.$(data +%F_%R)"
```

While this is an improvement in one sense in that it eliminates the need to manually type out the current date, it is a step backwards in another in that it requires me to remember the proper bash syntax and time format to get the desired result.

There has to be a better way...

### Functions + ~/.bashrc to the rescue

Fortunately, there was. Bash allows you define custom functions in a dotfile in your home directoy called .bashrc.  Any functions defined there will be available whenever you open a terminal window. 

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: If you're using zsh, you can do the same with ~/.zshrc</p>
</div>

I've leveraged this feature to define a custom function which I've called `add-date` which automatically adds the date to the filename of the given file (in my preferred format). 

Here's what I've added the following to my ~/.bashrc.

```bash
function add-date {
    mv $1 "$(date +%Y%m%d_%H%M%S)_$1"
}
```

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: After making edits to your ~/.bashrc (or ~/.zshrc) you need to run <code>source ~/.bashrc</code> (or <code>source ~/.zshrc</code>) for the edits to take effect for the terminal window you currently have open.</p>
</div>

Now I can simply run the `add-date` command and pass it a file and it will automatically add the date for me....

```
$ touch foo.txt
$ ls
foo.txt
$ add-date foo.txt
$ ls
20180214_182223_foo.txt
```

Feel free to use or modify as needed (e.g. if you prefer a different date format).