---
layout: blog-single
title: Aspell and Curly Quotes
description: 
date: January 13, 2017
description:  I spent a while trying to figure out the best way to deal with the issues aspell has with curly quotes. Here I reveal my conclusions.
tags: [Shell, Tools]
ad: domain-clamp-ad-b.html
---

[`aspell`](http://aspell.net/) really doesn't like curly quotes...

```bash
$ echo "This really shouldn’t fail" | aspell list
shouldn
$
$ echo "This really shouldn't fail" | aspell list
$
```

I ran up against this issue looking into adding a spell check featured for [`jekyll-pre-commit`](https://github.com/mpchadwick/jekyll-pre-commit).

<!-- excerpt_separator -->

There are a few threads you'll find on this issue, but most of them don't seem to indicate any resolution...

<hr>

**Tue, 19 Feb 2008 10:22:17 -0800**

> I use aspell from within Emacs. I have some documents that are stored in utf-8 and use the unicode code points for curly quotes (8220, 8221, 8216, and 8217) rather than ASCII straight quotes. Is there any way to get aspell to recognize a curly apostrophe as a word constituent so contractions (e.g. isn't, except where the ' is Unicode character 8217) are recognized as single words, correctly spelled words. At the moment it sees "isn" and complains about it.
>
> -Peter

[https://lists.gnu.org/archive/html/aspell-user/2008-02/msg00009.html](https://lists.gnu.org/archive/html/aspell-user/2008-02/msg00009.html)

**Tue, 22 Jul 2008 19:47:34 +1200**

> Did anyone find a solution to this problem?
> 
> Jeremy

[https://lists.gnu.org/archive/html/aspell-user/2008-07/msg00018.html](https://lists.gnu.org/archive/html/aspell-user/2008-07/msg00018.html)

**Tue, 22 Jul 2008 22:33:05 -0300**

> At first, I thought about adding it the special characters which can be
considered part of the word, but I just tried it, and it doesn't work.
Maybe because Aspell is 8 bit only, and AFAIK the curly apostrophe is
outside iso-8859-1.
>
> I guess the only proper way of doing this is making Aspell understand
both kinds of apostrophes as "synonyms", which AFAIK would require you
to file a feature request.
>
> Leonardo Fontenelle

[https://lists.gnu.org/archive/html/aspell-user/2008-07/msg00020.html](https://lists.gnu.org/archive/html/aspell-user/2008-07/msg00020.html)

<hr>

Some people even seem to be looking to turn off curly quotes entirely for this reason...

> How do I turn off smart quotes and apostrophes in Jekyll? It is breaking my gulp spellcheck process.

[http://stackoverflow.com/questions/25596792/how-do-i-turn-off-smart-quotes-in-jekyll](http://stackoverflow.com/questions/25596792/how-do-i-turn-off-smart-quotes-in-jekyll)

<hr>

I spent some time researching this issue myself, and from what I can see this best option at this point seems to be to replace the curly quotes with straight quotes (via `sed`) before sending to `aspell` as outlined [here](http://vi.stackexchange.com/questions/118/how-can-i-use-vims-spellcheck-with-smart-quotes#answer-172). Per the below, `aspell` is OK with things if you do that...

```bash
$ echo "This really shouldn’t fail" | sed "s/’/'/g" | aspell list
$
```

Per the stack overflow answer updating your dictionary is another option.
