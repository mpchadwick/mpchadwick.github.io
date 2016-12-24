---
layout: blog-single
title: Skipping A Number In An HTML Ordered List
description: Typically ordered lists just go up sequentially, but occasionally you may want to skip a number. Here, I show you how to do that.
date: December 21, 2016
image:
tags: [html]
ad: domain-clamp-ad-b.html
---

When writing an ordered list, numbers usually go sequentially up from 1, to 2, to 3 and so on. Anyone with the most basic knowledge of HTML knows that these lists should be represented with the `<ol>` element.

**Markup**

```html
<ol>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ol>
```

**Result**

1. HTML
2. CSS
3. JavaScript

However, what happens when you want to skip a number?

In this post I'll outline why one might want to do this and provide the solution for achieving the desired result.

<!-- excerpt_separator -->

### Why Would Someone Want To Skip A Number?

Good question. I'll give you an example. 

Let's say you're writing a top 5 list. For example, you're writing a list of the top 5 NBA regular season records of all time. On this list, it turns out that there is a **tie** for the third place spot (there really is at the time of writing this post). In that case, you would want to skip position four and go straight five...

<ol>
    <li>Golden State Warriors, 2015-16 | 73-9</li>
    <li>Chicago Bulls 1995-96 | 72-10</li>
    <li>Los Angeles Lakes, 1971-72 / Chicago Bulls, 1996-97 | 69-13 (TIE)</li>
    <li value="5">Philadelphia 76ers, 1966-67 | 68-13</li>
</ol>

We know that `<ol>`s have `<li>` children that just automatically go up. So how do we skip number 4?

### Introducing the `value` attribute

It turns out, this scenario is accounted for in [the HTML spec](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li#attr-value) via the `value` attribute. Simply tell the browser which number a particular item on the list **should** be, and it will accommodate.

**Markup**

```html
<ol>
    <li>Golden State Warriors, 2015-16 | 73-9</li>
    <li>Chicago Bulls 1995-96 | 72-10</li>
    <li>Los Angeles Lakes, 1971-72 / Chicago Bulls, 1996-97 | 69-13 (TIE)</li>
    <li value="5">Philadelphia 76ers, 1966-67 | 68-13</li>
</ol>
```

**Result**

<ol>
    <li>Golden State Warriors, 2015-16 | 73-9</li>
    <li>Chicago Bulls 1995-96 | 72-10</li>
    <li>Los Angeles Lakes, 1971-72 / Chicago Bulls, 1996-97 | 69-13 (TIE)</li>
    <li value="5">Philadelphia 76ers, 1966-67 | 68-13</li>
</ol>

Per the HTML spec, if you continue adding list items after providing a `value` it will continue where you left off.

**Markup**

```html
<ol>
  <li>One</li>
  <li>Two</li>
  <li value="4">Four</li>
  <li>Five</li>
</ol>
```

**Result**

<ol>
    <li>One</li>
    <li>Two</li>
    <li value="4">Four</li>
    <li>Five</li>
</ol>

### A Note On Markdown

I have yet to find a Markdown parser that offers support for supplying a `value` to a child `<li>` of an `<ol>`. In fact, [the Markdown spec](https://daringfireball.net/projects/markdown/syntax#list) contains some language implying that being able to do so would not be desired. Unfortunately, if you want to skip a number in an ordered list in a Markdown document, you'll need to write raw HTML :disappointed:

### Conclusion

I hope some of you found this article interesting and useful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.