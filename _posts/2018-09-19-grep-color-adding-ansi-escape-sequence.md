---
layout: blog-single
title:  "grep color Adding ANSI Escape Sequence"
description: My findings troubleshooting an issue where a strange sequence of characters were added at the end of each line of a file
date: September 19, 2018
image:
tags: [Shell]
---

Today I was using some command line kung-fu to transform a CSV with thousands of URL redirects into a text file containing the same redirects in Apache mod_rewrite format.

The command looked roughly like this <sup style="display: inline-block" id="a1">[1](#f1)</sup>...

```
$ cat redirects-with-store-ids.csv | grep ',17' | awk -F"," '{ print "redirect 301 /" $1 " https://www.example.com/" $2 }' > example-com-redirects.conf
```
{:.wrap}

After getting the command just right I opened generated the file in Sublime Text and saw some strange looking characters at the end of each line...

```
redirect 301 /page/beige.html https://www.example.com/page.html?color=51<0x1b>[01;31m<0x1b>[K
redirect 301 /page/black.html https://www.example.com/page.html?color=52<0x1b>[01;31m<0x1b>[K
redirect 301 /page/blue.html https://www.example.com/page.html?color=53<0x1b>[01;31m<0x1b>[K
redirect 301 /page/brown.html https://www.example.com/page.html?color=55<0x1b>[01;31m<0x1b>[K
redirect 301 /page/green.html https://www.example.com/page.html?color=57<0x1b>[01;31m<0x1b>[K
```

For some reason "<0x1b>[01;31m<0x1b>[K" had been appended at the end of every line.

<!-- excerpt_separator -->

Even more curious, when when I used the `cat` or `less` command to preview the same file in the terminal the strange characters disappeared...

```
$ cat example-com-redirects.conf
redirect 301 /page/beige.html https://www.example.com/page.html?color=51
redirect 301 /page/black.html https://www.example.com/page.html?color=52
redirect 301 /page/blue.html https://www.example.com/page.html?color=53
redirect 301 /page/brown.html https://www.example.com/page.html?color=55
redirect 301 /page/green.html https://www.example.com/page.html?color=57
```

And finally, in [TextEdit](https://support.apple.com/guide/textedit/welcome/mac) a I saw a similar, but slightly different sequence of strange characters.

```
redirect 301 /page/beige.html https://www.example.com/page.html?color=51[01;31m[K
redirect 301 /page/black.html https://www.example.com/page.html?color=52[01;31m[K
redirect 301 /page/blue.html https://www.example.com/page.html?color=53[01;31m[K
redirect 301 /page/brown.html https://www.example.com/page.html?color=55[01;31m[K
redirect 301 /page/green.html https://www.example.com/page.html?color=57[01;31m[K
```

Here "[01;31m[K" had been appended to the URLs - the same string of characters I saw in Sublime Text, except the "<0x1b>"s were missing

Some Googling brought me to the Stack Exchange question [How to create a file using a variable as filename?](https://stackoverflow.com/questions/8712260/how-to-create-a-file-using-a-variable-as-filename) where I found the following answer

> Something is adding color to your output. It might be `grep(1)`, it might `adb`, it might be baked into the `/system/build.prop` resource that you're reading.
>
> If you're lucky, it is being added by `grep(1)` -- because that is supremely easy to disable with `--color=no`
> 
> [https://stackoverflow.com/a/8713080/2877224](https://stackoverflow.com/a/8713080/2877224)

Turns out this was caused by the following alias in my `~/.zshrc`

```
alias grep="grep --color=always"
```

The `--color="always"` flag was causing grep to add an [ANSI color escape sequence](https://en.wikipedia.org/wiki/ANSI_escape_code) at the end of each line.

Re-running the same command, but explicitly passing `--color=no` to `grep` fixed the issue for me.

### Footnotes

<b id="f1">1</b>. Yes, I'm aware that `awk -F","` is not exactly a safe thing to do with a CSV (as the data could have commas) but I validated that the data that I was working with _didn't_ have commas before moving forward with this approach.[↩](#a1)