---
layout: page
title: Styles
no_index: true
sitemap: false
---

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

This is a normal paragraph of text. <a href="#">Here's a link</a>. Paragraph's are generally longer than what I've written so far, so I'm continuing to make it a bit longer. Again, this is just to demonstrate to you what a paragraph of text looks like.

> This is a blockquote. There's not much to say, but I'm going to write a bit here to make sure that it spans multiple lines so you can see how it looks in that case.
>
> The blockquote can also have multiple paragraphs.
>
> It can also have [links](#).

Here's another paragraph. This one has a footnote though <sup style="display: inline-block" id="a1">[1](#f1)</sup>

Now let's look at how code highlighting is handled. Here's some PHP.

```php
class CodeDemo extends BaseDemo
{
    private $myArg;

    public function __construct($myArg)
    {
        $this->myArg = $myArg;
    }

    public function sayArg()
    {
        return 'Hello ' . $this->myArg;
    }
}
```

Here is how images are treated:

<img
  class="rounded shadow"
  src="/img/blog/magento-2-3-5-csp/magento-miscellaneous-html@1x.png"
  srcset="/img/blog/magento-2-3-5-csp/magento-miscellaneous-html@1x.png 1x, /img/blog/magento-2-3-5-csp/magento-miscellaneous-html@2x.png 2x"
  alt="Screenshot showing Miscellaneous HTML in Magento">

Next let's look at the different "touts" that we can use.

<div class="tout">
<p>This is the first style of tout available <a href="#">Here's a link</a> demonstrating what links like here. Again, I'm writing a bit so you can see how it looks when it wraps to two lines.</p>
</div>

<div class="tout tout--secondary">
<p>This is the second style of tout available <a href="#">Here's a link</a> demonstrating what links like here. Again, I'm writing a bit so you can see how it looks when it wraps to two lines.</p>
</div>

<div class="tout tout--alt">
<p>This is the third style of tout available <a href="#">Here's a link</a> demonstrating what links like here. Again, I'm writing a bit so you can see how it looks when it wraps to two lines.</p>
</div>

Let's see a button

<div class="call-to-action-wrapper">
    <a class="call-to-action" href="#">Read more</a>
</div>

Next let's look at an embedded YouTube video:

<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/tmOJxIyjvcQ"
  srcdoc="<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img,span{position:absolute;width:100%;top:0;bottom:0;margin:auto}span{height:1.5em;text-align:center;font:48px/1.5 sans-serif;color:white;text-shadow:0 0 0.5em black}</style><a href=https://www.youtube.com/embed/tmOJxIyjvcQ?autoplay=1><img src=https://img.youtube.com/vi/tmOJxIyjvcQ/maxresdefault.jpg alt='Imagining A Magento World Without Caching | Max Chadwick | Meet Magento New York'><span>▶</span></a>"
  frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="Imagining A Magento World Without Caching | Max Chadwick | Meet Magento New York"
></iframe>

Finally, we have our footnotes.

### Footnotes

<b id="f1">1 </b>. Here's the footnote in question.[↩](#a1)