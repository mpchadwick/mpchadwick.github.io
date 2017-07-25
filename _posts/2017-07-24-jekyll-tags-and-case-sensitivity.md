---
layout: blog-single
title: Dealing with Jekyll Tags and Case Sensitivity
description: Tag case sensitivity can be a real pain when working on a Jekyll blog. Here, I outline a solution.
date: July 24, 2017
image: /img/blog/jekyll-tags-case-sensitivity/jekyll-pre-commit-no-duplicate-tags@1x.jpg
tags: [Jekyll]
ad: domain-clamp-ad-b.html
---

[To the chagrin of some](https://github.com/jekyll/jekyll/issues/2977#issue-45095797), tags in Jekyll are case sensitive. This means that "MySQL" and "mysql" are not the same tag. 

No matter whether you're using [jekyll-archives](https://github.com/jekyll/jekyll-archives) for your tag archives pages, or a custom solution, it's likely that you've felt some pain as a result of case sensitivity. [I recently went through every post on this blog and to add consistent casing to my tags](https://github.com/mpchadwick/mpchadwick.github.io/commit/80215c303a77d5cb760c73eea6d941eca0a54507).

Here I'll outline a solution I've developed to help alleviate the pain of dealing with case sensitivity and tags in Jekyll.

<!-- excerpt_separator -->

### Introducing jekyll-pre-commit

In January of 2017, I published v0.1.0 of [jekyll-pre-commit](https://github.com/mpchadwick/jekyll-pre-commit). The tagline...

> A Jekyll plugin to make sure your post is \_really_ ready for publishing

jekyll-pre-commit is a tool that uses [git pre-commit hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks#_committing_workflow_hooks) to run checks before allowing you to commit changes. For example, you can make sure that your post's meta description meets [best practice SEO length requirements](https://moz.com/learn/seo/meta-description).

Now, I've updated the gem to v0.2.1 and added a new check ["NoDuplicateTags"](https://github.com/mpchadwick/jekyll-pre-commit/blob/9b8b67363a524585049da12fcb8aad5bcbafb804/README.md#noduplicatetags) to help make sure you case sensitivity doesn't cause any issues when you're tagging posts. 

When enabled this check will run through the all tags in any post that's staged for commit and confirm that there are no duplicates in other posts throughout your site. If it does find any duplicates, it will tell you about them and prevent you from committing.

<img
class="rounded shadow"
src="/img/blog/jekyll-tags-case-sensitivity/jekyll-pre-commit-no-duplicate-tags@1x.jpg"
srcset="/img/blog/jekyll-tags-case-sensitivity/jekyll-pre-commit-no-duplicate-tags@1x.jpg 1x, /img/blog/jekyll-tags-case-sensitivity/jekyll-pre-commit-no-duplicate-tags@2x.jpg 2x"
alt="jekyll-pre-commit feedback when NoDuplicateTags fails">

Follow the [installation instructions](https://github.com/mpchadwick/jekyll-pre-commit#installation) to get started with jekyll-pre-commit. The project is 100% free and open source. 

I hope you find it useful!
