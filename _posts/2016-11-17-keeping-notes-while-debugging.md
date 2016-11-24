---
layout: blog-single
title: "Keeping Notes While Debugging"
description: In which I outline the benefits of keeping notes throughout the debugging process.
date: November 17, 2016
image: /img/blog/debug-notes/debug-notes-4@1x.jpg
tags: [thoughts, debugging]
ad: domain-clamp-ad-b.html
---

<img
  class="rounded shadow"
  src="/img/blog/debug-notes/debug-notes-4@1x.jpg"
  srcset="/img/blog/debug-notes/debug-notes-4@1x.jpg 1x, /img/blog/debug-notes/debug-notes-4@2x.jpg 2x"
  alt="Taking notes while debugging">

The majority of what I do in my day job involves maintaining inherited software. As a result, I spend a lot of time debugging. If you program for a living, [there's a pretty high chance you're in the same camp](http://bretthard.in/post/developers-spend-half-their-time-fixing-bugs). 

To get to the bottom of some of the nastiest issues, one practice that has, time and time again, proven itself invaluable is keeping detailed notes throughout a debugging session. In this post, I'll explain to you how this has helped me, and then offer some note-keeping tips.

<!-- excerpt_separator -->

### Picking Up Where You Left Off

The real nasty bugs tend to be things that aren't resolved in a single debugging session. As software developers we are typically juggling multiple priorities and, after some amount of investigation, solving a specific issue may get put on hold. Without any record of prior investigation, it's very hard to pick up where you left off, days, or worse, weeks later. If you keep detailed notes on the work conducted you can can get back up to speed by reading through them, which makes it much easier to jump back in.

### Passing Along The Torch

Sometimes, resolving an issue gets escalated from a junior developer to a senior. In other cases, there's an individual with more specific relevant knowledge that takes over. More practically, maybe someone goes on vacation. Without notes, the next developer is virtually starting from scratch and has no record of what you have done up to this point to investigate the issue.

### The Status Update

Notes can, and should, be circulated to all stakeholders in a recap following a debugging session. These can be used to demonstrate progress made, and, help others understand the challenge at hand. Notes may get the gears spinning of both technical, **and** non-technical folks that could help widen your vision perhaps leading you down an alternate, better, path to resolving an issue.

### Structure Helps Lead to Resolution

Sometimes, debugging can feel like trying to pull a needle out of a haystack. Personally, I've found that keeping notes on what I'm doing, as I'm doing it, helps me solve issues. 

For one, it forces me to pause and think about things, as I try to find the best way to summarize what I'm doing in my notes. Further, if I get to a point where I feel stuck, reading through and pondering my notes, is often very helpful in helping determine what it the best next step.

### How Should I Keep Notes?

Typically, I create a Markdown file for each debugging session spent looking into a given issue. At the top will be the title of the issue along with the date and then I'll first add a section for a description of the reported issue.

Next comes the meat. One thing I often do when debugging is trace through source code to understand code flow. I typically make notes of my findings to refer back to later. They look something like...

<img
  class="rounded shadow"
  src="/img/blog/debug-notes/debug-notes-code-flow@1x.jpg"
  srcset="/img/blog/debug-notes/debug-notes-code-flow@1x.jpg 1x, /img/blog/debug-notes/debug-notes-code-flow@2x.jpg 2x"
  alt="Noting code flow while debugging">

Additionally, it's typically a good idea to keep track of any actions I took to attempt to resolve an issue. For example, if I tried a `git bisect` I'll make note of that including how far back I went to make sure I don't try it again.

Other things I typically keep track of...

- Queries run against a database and the results.
- Commands run against log files and the results.
- Specific code changes made and the results of running test cases with those changes.

Try to answer the following questions in your notes...

- What did I do?
- Why did I do this?
- What was the result?
- What did I conclude from the result?

### Spreadsheets

In addition to Markdown, I sometimes find spreadsheet is a useful format for keeping notes. For example, let's say I'm investigating a downtime incident that set off multiple alerts. In this case I'll create a spreadsheet with a column for

- Source of alert
- Alert open time
- Alert close time
- Details provided by alert platform
- My own analysis on this specific alert in the context of the downtime incident

Then, I'll create a new row in the spreadsheet for each alert.

<img
  class="rounded shadow"
  src="/img/blog/debug-notes/debug-notes-spreadsheet@1x.jpg"
  srcset="/img/blog/debug-notes/debug-notes-spreadsheet@1x.jpg 1x, /img/blog/debug-notes/debug-notes-spreadsheet@2x.jpg 2x"
  alt="Using a spreadsheet to take notes while debugging">

I might also use a spreadsheet if I have a set of "cases" of a given issue and there are certain pieces of information that I want to check and keep track of for each case.

### Conclusion

I hope that this article was effective in demonstrating the value of keeping notes throughout the debugging process.If you have any comments, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
