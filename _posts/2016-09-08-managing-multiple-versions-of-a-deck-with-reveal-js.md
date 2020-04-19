---
layout: blog-single
title: Managing Multiple Versions of a Deck with Reveal.js
description: How do you manage multiple versions of the same deck? This guide outlines a simple approach the will eliminate the need to update content twice.
date: September 08, 2016
tags: [Thoughts, Tools, Public Speaking]
has_tweet: true
---

I'm currently in the process of paring down a 60 minute talk to fit into a 30 minute time slot. Going in, I had a pretty good idea of what needed to be cut, but one challenge I wasn't sure how to tackle was how to manage multiple versions of a single deck.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">how do you manage 30 minute and 60 minute version of a deck for the same talk?</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/771746555552563201">September 2, 2016</a></blockquote>

Aside from [my co-worker Gil's "insightful" idea](https://twitter.com/Intradox/status/772271225376804865) I didn't get much of a response on Twitter [nor did I find much on Google](https://www.google.com/#q=reveal+js+multiple+versions). I did, however, come up with a solution for this that I think it pretty sweet. I figured I'd write up a quick blog post to outline what I did.

 <!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: The technique outlined here is relevant if your deck is powered by <a href="https://github.com/hakimel/reveal.js/">Reveal.js</a>.</p>
</div>
 
### The Wrong Path
 
My initial thought on how to handle this was with separate [git branches](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell). I already had the 60 minute version created, so I figured I'd just create a new branch for the 30 minute version based off the 60 minute version and then remove slides as needed.

I started down this path, but quickly realized that in the long term this approach could turn into a maintainability nightmare. For example, let's say I want to update some info in my [vanity slide](https://blog.calevans.com/2016/08/16/regarding-vanity-slides/), which would appear in both versions of the deck. Now I need to remember to update both branches. If I forget, and only update in one version, then give a presentation of the other version, now I'm displaying out of date or incorrect information. Ugh. There's got to be a better way.
 
### How To Do It

I started to think, all I really need to do is hide or modify certain slides for the 30 minute version. How can I make that happen in my HTML and JavaScript based deck?

Hmm...well, I have access to the document via JavaScript. Now we're getting somewhere.

Basically, the idea I landed on is to use a query parameter to specify which version of the deck to show. Along with this, I add data attributes throughout the document to specify what to show or hide based on the version of the deck requested. Finally, I add a few lines of JavaScript to inspect the URL and perform the desired behavior.

### Implementation

The JavaScript is pretty simple. [We don't need no stinkin jQuery](http://youmightnotneedjquery.com/). Here it is...

```js
Reveal.addEventListener('ready', function(event) {
    var q = window.location.search;
    if (q) {
        var mode = q.split('?mode=')[1];
        var hide = document.querySelectorAll('[data-not="' + mode + '"]');
        Array.prototype.forEach.call(hide, function(node) {
            node.parentNode.removeChild(node);
        });

        var show = document.querySelectorAll('[data-is="' + mode + '"]');
        Array.prototype.forEach.call(show, function(node) {
            node.style.display = "initial";
        });
    }
})
```

Note that this implementation assumes that there will only be one query parameter and that query parameter will be set to `?mode=[mode-goes-here]`. It wouldn't be difficult to add support for URLs with more than one query parameter, but I wanted to keep this as simple as possible.

Now, all we need to do is add `data-not="30m"` to slides that should be hidden in the 30 minute version or `data-is="30m"` to things that we only want to show in the 30 minute version. You also need to make sure that all elements with `data-is` are hidden by default

```css
[data-is] {
    display: none;
}
```

### See It In Action

You can see this in action on the the following deck.

**Full Version**

[http://maxchadwick.xyz/monitoring-and-improving-fpc-hit-rate/#/](http://maxchadwick.xyz/monitoring-and-improving-fpc-hit-rate/#/)

**30 Minute Version**

[http://maxchadwick.xyz/monitoring-and-improving-fpc-hit-rate/?mode=30m#/](http://maxchadwick.xyz/monitoring-and-improving-fpc-hit-rate/?mode=30m#/)

**Commits**

[https://github.com/mpchadwick/monitoring-and-improving-fpc-hit-rate/compare/4fb272c137de71275722dce99aebb598bb1be86b...368fcc03464cb0af95ba29c8bb1e40976e8d6848](https://github.com/mpchadwick/monitoring-and-improving-fpc-hit-rate/compare/4fb272c137de71275722dce99aebb598bb1be86b...368fcc03464cb0af95ba29c8bb1e40976e8d6848)


### Conclusion

I hope that this will help some people find a better approach to managing multiple versions of the same deck. As always, feel free to leave any thoughts in the comments below or reach out to me on [Twitter](http://twitter.com/maxpchadwick).
