---
layout: blog-single
title:  Syntax Highlighting And Color Contrast Accessiblity
description: My journey looking for, and ultimately building out my own solution for color contrast accessibility and syntax highlighting.
date: November 16, 2017
image: /img/blog/syntax-highlighting-and-color-constrast-accessibility/google-chrome-accessibility-audit@2x.jpg
tags: [Frontend, Accessibility]
---

<style>
iframe {
      width: 600;
      height: 450;
      border: 0;
      display: block;
    }
</style>

Recently I watched [a video titled "Totally Tooling Tips: Accessibility Testing" published to the Google Chrome Developers YouTube Channel](https://www.youtube.com/watch?v=56zCnwj58e4).

The video demos Chrome's built in accessibility audit tool.

<img
  class="rounded shadow"
  src="/img/blog/syntax-highlighting-and-color-constrast-accessibility/google-chrome-accessibility-audit@1x.jpg"
  srcset="/img/blog/syntax-highlighting-and-color-constrast-accessibility/google-chrome-accessibility-audit@1x.jpg 1x, /img/blog/syntax-highlighting-and-color-constrast-accessibility/google-chrome-accessibility-audit@2x.jpg 2x"
  alt="Google Chrome Accessibility Audit">
  
After watching the video I decided to run the tool against this site. 

There were [a few things I needed to fix to get this site to pass the audit](https://github.com/mpchadwick/mpchadwick.github.io/compare/b8df30bb80720fcc25c260a4475f5ea410a27a90...145d8adec568b3df61e4c075195d087e5e1ecb44). One of those things was the color contrast of the syntax highlighting I use for code snippets.
  
 In this post I'll explore that problem and talk about my approach to solving it.

<!-- excerpt_separator -->

### My Initial Reaction

When I initially saw that syntax highlighting was causing the audit to fail, my reaction was "well, I don't need to worry about that." 

However, as I thought about it more, I realized that there's no reason that my code examples shouldn't have sufficient contrast to be easily readable by users with color vision deficiency. After all, content I publish to my blog is not just for my own consumption (where I'm free to choose whatever syntax highlighting style I prefer), but rather to the internet for mass consumption amongst all its users.

As such, I set out to find a solution for the problem.

### Searching For A Solution

At the time of writing this article, this blog is published with Jekyll, which uses [Rouge](https://github.com/jneen/rouge), a ruby-based syntax highlighter that is compatible with [pygments](http://pygments.org/). I was personally using [this stylesheet](https://gist.github.com/nicolashery/5765395) to apply the solarized-dark theme to my code snippets.

In my search for a solution for accessible stylesheets I pretty much came back empty handed. As such, I took matters into my own hand and [darkened the background color to `#000000`](https://github.com/mpchadwick/mpchadwick.github.io/commit/599cc114b80a8c4b30be1f8007a911535de3a66c) which was good enough to make my site pass the accessibility audit. 

### A Better Solution

I started to think about the problem more and realized it doesn't seem to be something people are thinking about much...at least I couldn't find much about it in my searching. As such, I began to form the idea of publishing a library of accessible stylesheets, that others can use on their websites.

Eventually I landed on an idea. 

### Introducing pygments-high-contrast-stylesheets

[pygments-high-contrast-stylesheets](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/) is a hard fork of [pygments-css](https://github.com/richleland/pygments-css) with WCAG AA passing stylesheets. 

At first, I was manually converting them, but eventually I built out [a Ruby script which fully automates the process](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/blob/c678dd005994a9807ded4ad2f88bf86679fb8d51/tools/make-stylesheet). 

At the time of writing this there are 10 different stylesheets available, and they all pass the Chrome accessibility audit (which checks that they pass WCAG AA).

You can [check out pygments-high-contrast-stylesheets on GitHub here](https://github.com/mpchadwick/pygments-high-contrast-stylesheets) and also preview [demos of all the themes here](https://maxchadwick.xyz/pygments-high-contrast-stylesheets/).

Here's a quick demo of the difference for solarized-dark

#### Before

<iframe title="solarized-dark demo before converting stylesheet" src="/img/blog/syntax-highlighting-and-color-constrast-accessibility/solarized-dark-original.html"></iframe>

#### After

<iframe title="solarized-dark demo after converting stylesheet" src="/img/blog/syntax-highlighting-and-color-constrast-accessibility/solarized-dark-converted.html"></iframe>

To my eye the difference is subtle, but upon close inspection it is clear that the colors in the "after" example have been lightened and stand out better against the background than those of the "before" example.