---
layout: blog-single
title: A Review Of Emoji Usage In Technical Blogs
description: I parsed the source code of hundreds of technical blogs to answer 3 questions. Here, I document my findings.
date: December 20, 2016
image:
tags: [writing]
ad: domain-clamp-ad-b.html
---

A while back, [I added emoji support](https://twitter.com/maxpchadwick/status/799455262700687361) to this blog. I've used it here and there since then, but not extensively. However, the addition got me interested in how other technical bloggers are using emoji on their sites. 

Just for fun, I decided to do a deep dive on that topic, parsing through the source code of hundreds of blogs published on GitHub. There were three basic questions that I wanted to answer...

1. How often are technical bloggers using emoji?
2. Which emoji are used most frequently?
3. How are emoji used into blog posts?

Here, I'll share the results of this digging for anyone else who is interested in this topic.

<!-- excerpt_separator -->

### The Data Source

There is [a page on the Jekyll wiki](https://github.com/jekyll/jekyll/wiki/sites) with a list of sites built using Jekyll. Anyone can add their site to the list as long as it's built with Jekyll and is open source. At the time of writing this post, there are over 1,000 sites listed. 

This provided the perfect data source for my analysis for the following reasons...

- Due to the technical nature of the Jekyll platform it is inherently developer oriented.
- The data is all publicly available

I grabbed a copy of the markdown source of the file and used a bash one-liner to isolate the URLs to the relevant repositories.

```bash
➜ cat jekyll-sites.md \
    | awk -F"(" '{ print $4 }' \
    | awk -F")" '{ print $1 }' \
    > repos.txt
```

Next I downloaded them. 

```bash
➜  cat repos.txt \
    | awk -F'/' '{ print "http://user:password@github.com/" $4 "/" $5}' \
    | head -n 300 \
    | xargs -L1 git clone
```

Downloading all this data took quite a bit of time, especially on my home internet connection. I downloaded them in batches of 300, deleting any repos over 200MB along the way. Also, the download url no longer worked on many of the sites listed. Still, when all was said and done, I had the code of 763 Jekyll powered sites to work with for my analysis.

### Detecting Emoji Usage

To detect emoji usage, I made an assumption that [jemoji](https://rubygems.org/gems/jemoji) is being used. It's what I'm using on this blog and is [available on GitHub pages](https://pages.github.com/versions/), where many [Jekyll users host their sites](https://jekyllrb.com/docs/github-pages/). Jemoji allows you to use the same emoji system that is available on GitHub. For example, you can write `:shipit`: and you'll see this. :shipit:

> **NOTE** I did `grep` the data for [twemoji](https://github.com/twitter/twemoji), another popular emoji system that provides users with the same set of emoji available on Twitter. The search turned up no results.

In order to detect jemoji usage I used the following regular expression... `'\:.+\:'`. On its own, this RegEx leads to a lot of false positives. For example, 09:02:15 (such as in the case of a time) would be incorrectly matched. As a result, I validated each match against the list of known GitHub emojis [obtained via the GitHub API](https://developer.github.com/v3/emojis/). 

I also filtered matches against a known list of false positives, as well as a filename blacklist. I published the script used to analyze the data [here](https://gist.github.com/mpchadwick/627eb8348af947d8bbcb2cd92f1e6caf) for anyone interested.

### Characterizing The Usage

Once I had a list of emoji usage, I manually reviewed a sampling and kept a tally of various characteristics for things like punctuation and placement in the document.

### So, How Often Do Technical Bloggers Use Emoji?

Emoji usage on technical blogs turned out to be fairly rare. Of the 763 sites scanned, only 24 were found to have used emoji, a little over 3%. 

Across those 24 sites, emojis were found to have been used 156 times. 

There were a total of 2,856 documents across these sites, meaning, on average, these authors were including one emoji for every 20 documents published. 

However, there were a number of sites that had only ever used emoji once, despite containing hundred of documents. Filtering out these sites and just focusing on the top 5 emoji users, on average, you'd find  roughly one emoji for every 5 documents published (19%).

### What are the most popular emoji?

The most popular emoji on technical blogs was :smile: (`:smile:`), which was used 39 times. In second place was :+1: (`:+1:`) with 15 uses. Here are the top 5...

1. :smile: (`:smile:`) - 39 uses
2. :+1: (`:+1:`) - 15 uses
3. :wink: (`:wink:`) - 9 uses
4. :grinning: (`:grinning:`) - 8 uses
5. :point_down: (`:point_down:`)  / :blush: (`:blush:`) / :stuck_out_tongue_winking_eye: (`:stuck_out_tongue_winking_eye:`) / :x: (`:x:`) / :grin: (`:grin:`) - 3 uses (TIE)

### How Emoji Are Used In Blogs

The most common trait among all bloggers was that emoji are typically placed at the end of a paragraph, such as in the below...

<img
  class="rounded shadow"
  src="/img/blog/emoji-usage-on-technical-blogs/end-of-paragraph@1x.jpg"
  srcset="/img/blog/emoji-usage-on-technical-blogs/end-of-paragraph@1x.jpg 1x, /img/blog/emoji-usage-on-technical-blogs/end-of-paragraph@2x.jpg 2x"
  alt="Emojis are typically placed at the end of a paragraph">
  
This was the case with roughly 70% of the emojis reviewed.

Next, I found that they're also a lot more likely to be found in the end of a document than the beginning. A little over 25% of the emojis were placed in the last paragraph whereas only 7% were found in the first paragraph.

Finally, I found that emojis are most typically used at the end of a sentence with no other punctuation, which accounts for 43% of all uses reviewed. However, adding punctuation before the emoji is common as well, and happened 33% of the time. Placing punctuation after an emoji is less likely at 16%, and emoji's were placed in the middle of sentences only 8% of the time.

<img
  class="rounded shadow"
  src="/img/blog/emoji-usage-on-technical-blogs/emoji-punctuation@1x.jpg"
  srcset="/img/blog/emoji-usage-on-technical-blogs/emoji-punctuation@1x.jpg 1x, /img/blog/emoji-usage-on-technical-blogs/emoji-punctuation@2x.jpg 2x"
  alt="A graph showing distribution of various types of emoji punctuation">

### My Takeaways

I was a little surprised at how few of the blogs had used emoji. After all, blogging is a fairly casual form form of writing, so emoji usage seems not inappropriate :sunglasses:

Moreover, [emoji has been found to increase open rates in email](http://www.experian.com/blogs/marketing-forward/2012/07/17/thinking-about-using-symbols-in-your-email-subject-lines/) and [engagement on social media](http://www.wordstream.com/blog/ws/2015/11/19/twitter-emoji).

I was also interested in the punctuation aspects of emoji usage since [there doesn't seem to be a consensus on this subject](http://mentalfloss.com/article/65394/how-do-you-punctuate-around-emoticons-and-emoji). On this site, I've typically been omitting punctuation when using emoji. It was reaffirming to see that most authors feel the same way.

### Conclusion

I hope some of you found this article interesting and useful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.