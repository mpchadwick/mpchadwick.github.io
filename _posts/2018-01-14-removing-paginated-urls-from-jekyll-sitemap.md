---
layout: blog-single
title:  "Removing Paginated URLs From jekyll-sitemap"
description: A review of how paginated URLs can be removed from a sitemap for a Jekyll site generated with jekyll-sitemap.
date: January 14, 2018
image:
tags: [Jekyll]
---

While I couldn't find any official statements from Google on the matter, leaving paginated URLs out of your sitemap generally seems to be agreed upon as best practices. 

However, by default, if you're using [jekyll-sitemap](https://github.com/jekyll/jekyll-sitemap) to generate a sitemap for your Jekyll based website, paginated URLs will be included.

In this post, let's explore how you can remove these URLs from your sitemap.

<!-- excerpt_separator -->

### Front Matter Defaults

As discussed in [the "Exclude Pagination Pages" issue within the jekyll-sitemap GitHub repo](https://github.com/jekyll/jekyll-sitemap/issues/163) the trick is to use [front matter defaults](https://jekyllrb.com/docs/configuration/#front-matter-defaults).

On this site, I'm using the following configuration

```yaml
paginate_path: "/blog/page/:num/"

defaults:
  -
    scope:
      path: "blog/page"
    values:
      sitemap: false
```

This will automatically add `sitemap: false` to the front matter for all paginated URLs, ensuring they are not added to the sitemap.

### The Problem With Some Paginate Paths

While front matter defaults are a great solution for this, depending on your `paginate_path` you may run into an issue.

For example, on this site, prior to implementing front matter defaults to remove paginated URLs from the sitemap I was using the following `paginate_path`...

```yaml
paginate_path: "/blog/:num/"
```

The front matter default would have had to be as follows to add `sitemap: false` to all paginated URLs.

```yaml
defaults:
  -
    scope:
      path: "blog"
    values:
      sitemap: false
```

However, this would have also caused https://maxchadwick.xyz/blog/ to have been excluded from the sitemap (the front page of my blog).

In order to use front matter defaults, I needed to change my `paginate_path`, but this also would mean that all my old paginated URLs (which were being crawled and indexed by Googlebot) would start to 404.

My solution was to [jekyll-redirect-from](https://github.com/jekyll/jekyll-redirect-from) to create redirects for all the old URLs. I created a simple bash script to create all the files...

```bash
#!/usr/bin/env bash

count=$1
for ((i=2; i<=count; i++)); do
	mkdir blog/$i
	echo "---" > blog/$i/index.html
	echo "redirect_to: /blog/page/$i" >> blog/$i/index.html
	echo "sitemap: false" >> blog/$i/index.html
	echo "---" >> blog/$i/index.html
done
```

I had 19 paginated URLs at the time made the switch so I ran it as follows

```
$ ./jekyll-pagination-redirects 19
```

You can see the diff from when I made the switch [here](https://github.com/mpchadwick/mpchadwick.github.io/commit/a02ef38d36e732d9a7ea042e09b4722cffd494bb).