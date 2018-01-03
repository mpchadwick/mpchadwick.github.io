---
layout: blog-single
title:  Twitter Cards for Jekyll with jekyll-seo-tag
description: A look at how jekyll-seo-tag can be used to add Twitter Card support to a Jekyll site.
date: January 02, 2018
image: /img/blog/jekyll-seo-tag-twitter-cards/code.jpg
tags: [Jekyll]
---

If you run a Google Search for for ["jekyll twitter cards"](https://www.google.com/search?q=jekyll+twitter+cards) you'll come across many articles with instructions for setting up Twitter Cards on a Jekyll blog. 

All the posts I've read suggest updating layout / template files with the required Twitter Cards `<meta>` tags.

While this is certainly a valid approach, there's another way to do it that doesn't require writing any code. Instead this can be handled entirely by [jekyll-seo-tag](https://github.com/jekyll/jekyll-seo-tag), a [GitHub Pages supported](https://pages.github.com/versions/) Jekyll plugin.

Here's let's take a look at how this can be done.

> Note: This post is based on jekyll-seo-tag as of version 2.4.0.

<!-- excerpt_separator -->

### Installing The Plugin

Installing jekyll-seo-tag, is no different than installing any other jekyll plugin. Per [the Jekyll documentation](https://jekyllrb.com/docs/plugins/) simply specify the plugin in your `_config.yml`...

```yaml
plugins:
  - jekyll-seo-tag
```

This will make GitHub pages know to use the plugin.

To install locally run `gem install jekyll-seo-tag` at the command line.

### Declaring Your Twitter Username In _config.yml

Next, you'll need to declare your Twitter username in your `_config.yml`. Without this, jekyll-seo-tag will not include the meta tags. 

On my site this looks like this...

```yaml
twitter:
  username: maxpchadwick
```

### Including An Image For Your Post

This step is not required, but is recommended. 

If you specify an image in your post's front matter, jekyll-seo-tag will specify that your post should display as a "Summary Card with Large Image" and use that image for the card. Alternately, the card display a "Summary" card and will not include any image.

You can define the image in your post's front matter as follows...

```yaml
image: /img/blog/my-image.jpg
```

### Digging Into The jekyll-seo-tag Source

Just for fun, below I'm including the code from `jekyll-seo-tag` that is involved with generating the Twitter Card. Using this we can see the exact logic which is at play.

{% raw %}
```liquid
{% if site.twitter %}
  {% if seo_tag.image %}
    <meta name="twitter:card" content="summary_large_image" />
  {% else %}
    <meta name="twitter:card" content="summary" />
  {% endif %}

  <meta name="twitter:site" content="@{{ site.twitter.username | replace:"@","" }}" />

  {% if seo_tag.author.twitter %}
    <meta name="twitter:creator" content="@{{ seo_tag.author.twitter }}" />
  {% endif %}
{% endif %}
```
{% endraw %}

[https://github.com/jekyll/jekyll-seo-tag/blob/520e78385b21f86bb7edb934007d99f0b217a9c2/lib/template.html#L32-L40](https://github.com/jekyll/jekyll-seo-tag/blob/520e78385b21f86bb7edb934007d99f0b217a9c2/lib/template.html#L32-L40)

Perhaps the most interesting thing worth noting is that the `twitter:image` meta tag is not included on the page. Instead, jekyll-seo-tag leverages the fact that Twitter will use the `og:image` for a "Summary Card with Large Image" if the `twitter:image` is not included.