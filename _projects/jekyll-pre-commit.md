---
title: jekyll-pre-commit
position: 300
selected: true
languages: Ruby
tags: Jekyll
---

I built a Jekyll plugin which uses git pre-commit hooks to run checks before allowing users to commit changes to their Jekyll sites. Some things it can check...

- Is your `<title>` and `<meta name="description">` a good length (for SEO purposes)?
- Did you forget to include anything in your front matter (for example forgetting to write a description)?
- Are any of the values in your front matter duplicated (for example you copy / pasted them from another post)?

In addition to the checks it ships with, users can write their own checks by placing them in their site's `_plugins/` directory.

<a class="call-to-action" href="https://github.com/mpchadwick/jekyll-pre-commit">View on GitHub</a>
