---
layout: blog-single
title: Faster Search With ripgrep
description: A comparison of ripgrep to grep -r, specifically looking at the Magento 1 and Magento 2 code bases.
date: December 23, 2016
image:
tags: [tools, linux]
ad: domain-clamp-ad-b.html
---

Between massive log files and big code bases, if you're a developer, there's a good chance you spend a lot of time searching.

`grep` is typically the old standby here. I know I've used it just about every day for as long as I can remember. 

However, there's a new kid on the block that goes by the name of [`ripgrep`](https://github.com/BurntSushi/ripgrep) (executable as `rg`) that's really stirring things up. Let me show you what there is to like about `ripgrep`.

<!-- excerpt_separator -->

### It's Fast. Like Really Fast.

For me, `ripgrep`'s main attraction is that it's crazy fast.

Most of my development work is done with the Magento platform. A vanilla installation of Magento Enterprise Edition v1.14.3.1 is...

- 170 MB in size
- Has 18,393 files

With Magento 2, the code base has more than doubled. Vanilla Magento Enterprise Edition v2.1.3 is...

- 404 MB in size
- Has 53,943 files

Even when the files are [cached in memory](https://www.thomas-krenn.com/en/wiki/Linux_Page_Cache_Basics), searching the entire Magento code base with `grep -r` feels slow. However, with `ripgrep` it feels instant.

I did some benchmarking to find out just how much faster `ripgrep` is. Here's a comparison of the amount of (clock) time it takes to search for "isStraight" across the entire Magento code base with `ripgrep` as compared to `grep -r` on my MacBook with the files in cache.

#### Magento Enterprise Edition 1.14.3.1

<img
  class="rounded shadow"
  src="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m1-cached@1x.jpg"
  srcset="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m1-cached@1x.jpg 1x, /img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m1-cached@2x.jpg 2x"
  alt="A graph showing a speed comparison of grep -r to ripgrep on Magento 1.14.3.1 cached">

#### Magento Enterprise Edition 2.1.3

<img
  class="rounded shadow"
  src="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m2-cached@1x.jpg"
  srcset="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m2-cached@1x.jpg 1x, /img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m2-cached@2x.jpg 2x"
  alt="A graph showing a speed comparison of grep -r to ripgrep on Magento 2.1.3 cached">

As you can see `ripgrep` is more than 10 times faster searching through both the Magento 1 and 2 codebases.

### Cool Cache

When the files being searched are not in cache (e.g. searching the files for the first time), the savings are not as drastic. The overhead in this case is not searching, but rather reading from disk. Still, `ripgrep` will save you a bit of time in this case. Here's a comparison of the same search with a cool cache.

#### Magento Enterprise Edition 1.14.3.1

<img
  class="rounded shadow"
  src="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m1-uncached@1x.jpg"
  srcset="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m1-uncached@1x.jpg 1x, /img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m1-uncached@2x.jpg 2x"
  alt="A graph showing a speed comparison of grep -r to ripgrep on Magento 1.14.3.1 uncached">

#### Magento Enterprise Edition 2.1.3

<img
  class="rounded shadow"
  src="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m2-uncached@1x.jpg"
  srcset="/img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m2-uncached@1x.jpg 1x, /img/blog/faster-search-with-ripgrep/grep-vs-ripgrep-m2-uncached@2x.jpg 2x"
  alt="A graph showing a speed comparison of grep -r to ripgrep on Magento 2.1.3 uncached">

### Other Things of Note

`ripgrep` is not intended to be a drop in replacement for `grep`. A few things are of note here...

#### Recursive by default

`ripgrep` searches recursively by default. You do not need to supply any additional flags (such as `-r` in `grep`s case).

#### `.gitignore` handling

By default it will not search any thing that is ignored via `.gitignore`. This can be a blessing or a curse. To override this behavior you can use the `-u` flag.

#### Different format

`ripgrep` does not print its results in the same format as `grep -r`. It uses syntax highlighting by default. It also print all matches for a single file underneath the file name with line numbers

**`ripgrep`**

<img
  class="rounded shadow"
  src="/img/blog/faster-search-with-ripgrep/ripgrep-terminal-example@1x.jpg"
  srcset="/img/blog/faster-search-with-ripgrep/ripgrep-terminal-example@1x.jpg 1x, /img/blog/faster-search-with-ripgrep/ripgrep-terminal-example@2x.jpg 2x"
  alt="ripgrep terminal example">

**`grep -r`**

<img
  class="rounded shadow"
  src="/img/blog/faster-search-with-ripgrep/grep-r-terminal-example@1x.jpg"
  srcset="/img/blog/faster-search-with-ripgrep/grep-r-terminal-example@1x.jpg 1x, /img/blog/faster-search-with-ripgrep/grep-r-terminal-example@2x.jpg 2x"
  alt="grep -r terminal example">

This means you won't be able to just replace `grep` with `rg` for your `bash` one-liners.

### Conclusion

I hope some of you found this article interesting and useful. There are certainly other things of note regarding `ripgrep` that I have not covered, so I encourage you to read through [the README](https://github.com/BurntSushi/ripgrep/blob/master/README.md) and [this blog post by the tool's author](http://blog.burntsushi.net/ripgrep/) to learn more. 

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.