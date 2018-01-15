---
layout: blog-single
title: Consuming Multiple Archives Into A Single Model For A twitter_ebooks Bot
description: How to built a model for your twitter_ebooks bot using multiple archives
date: May 25, 2017
image: /img/blog/twitter-bot-multiple-archives-single-model/twitter_bot_code.jpg
tags: [Twitter Bot]
ad: domain-clamp-ad-b.html
---

Recently, I launched [my own ebooks bot](https://github.com/mpchadwick/mage__ebooks).

If you read [the twitter_ebooks README](https://github.com/mispy/twitter_ebooks/blob/75566103d45ef116a947aa8321304672e04af2b2/README.md), you'll see that you can use the command `ebooks consume` to generate a text model for the bot to work from based on a JSON archive of tweets, or a plain text file.

This is nice, but one question I had was, can I build my text model from multiple sources? 

<!-- excerpt_separator -->

It's not currently documented in the README, but it turns out you can. To do so, you use the `ebooks consume-all` command. 

The signature is as follows...

```
$ ebooks consume-all <model_name> <corpus_path> [corpus_path2] [...]
```

You'll see `consume-all` mentioned in the usage string if you run `ebooks` with no arguments.

```
$ ebooks
Usage:
     ebooks help <command>

     ebooks new <reponame>
     ebooks s[tart]
     ebooks c[onsole]
     ebooks auth
     ebooks consume <corpus_path> [corpus_path2] [...]
     ebooks consume-all <model_name> <corpus_path> [corpus_path2] [...]
     ebooks append <model_name> <corpus_path>
     ebooks gen <model_path> [input]
     ebooks archive <username> [path]
     ebooks tweet <model_path> <botname>
     ebooks version
```

While this is helpful, ideally, I think this feature should be documented in the README.

I submitted [a PR to do just that here](https://github.com/mispy/twitter_ebooks/pull/140). However, the project hasn't been updated in a while, so I'm not sure if / when it will be merged.

### Conclusion

I hope you found this post helpful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
