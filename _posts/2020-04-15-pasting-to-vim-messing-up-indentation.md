---
layout: blog-single
title: Pasting into Vim Messing Up Indentation
date: April 15, 2020
image: /img/blog/vim-indenting/vim-messed-up-indentation@2x.png
tags: [Tools]
---

This morning I was trying to paste so XML from a local file into a remote file using Vim. However when I did it, it was messing up the indentation really badly, essentially indenting each new line an additional level.

<img
  class="rounded shadow"
  src="/img/blog/vim-indenting/vim-messed-up-indentation@1x.png"
  srcset="/img/blog/vim-indenting/vim-messed-up-indentation@1x.png 1x, /img/blog/vim-indenting/vim-messed-up-indentation@2x.png 2x"
  alt="Screenshot of messed up indentation in Vim">

<!-- excerpt_separator -->

Some Googling brought me the article ["How to stop auto indenting"](https://vim.fandom.com/wiki/How_to_stop_auto_indenting) on the Vim Tips Wiki. The article is thoroughly details the many different options to control Vim's auto-indentation.

For me, the best option was "Disabling auto indent temporarily to paste" as I was in the middle of production maintenance and didn't want to think about the best long term configuration.

With the file open while in normal mode enter the following command:

```
:set paste
```

Now you can paste text without having the indentation method messed up:

<img
  class="rounded shadow"
  src="/img/blog/vim-indenting/vim-paste-command@1x.png"
  srcset="/img/blog/vim-indenting/vim-paste-command@1x.png 1x, /img/blog/vim-indenting/vim-paste-command@2x.png 2x"
  alt="Screenshot show Vim paste command">

