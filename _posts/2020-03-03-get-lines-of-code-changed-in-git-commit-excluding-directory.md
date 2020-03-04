---
layout: blog-single
title: Get Lines of Code Changed in git diff Excluding Directory
date: March 3, 2020
image:
tags: [Git, Shell]
---

Recently I was faced with large amount of code requiring review. I needed to get back to the individual who requested the review with an estimate of how long it would take.

To give an informed estimate, it's useful to have a sense of how many lines of code have changed. This is generally easy to do with the [`--shortstat` diff option](https://git-scm.com/docs/diff-options/1.7.7#diff-options---shortstat) (GitHub also conveniently displays this when looking at a pull request):

```
$ git diff --shortstat 2.0.0 2.3.0
 209 files changed, 30020 insertions(+), 2531 deletions(-)
```

However a quick glance at the changeset told me that the majority of the changes were unit test files, which I wasn't particularly interested in reviewing here (this was a review of 3rd party code). I wanted to figure out how many lines of code had changed, **excluding** test files.

<!-- excerpt_separator -->

I did some Googling but didn't find a great answer. [This](https://stackoverflow.com/a/46197661) StackOverflow answer was informative, but ultimately didn't outline a clear solution to the problem.

I dug into it a bit myself and came up with the following command, which did what I was looking for.

```
$ git diff --stat 2.0.0 2.3.0 \
  | grep -v 'Test/' \
  | awk -F"|" '{ print $2 }' \
  | awk '{ print $1 }' \
  | sed '/^$/d' \
  | paste -sd+ - \
  | bc
10745
``` 

Let's do a quick review of what's going on here...

#### Get the full diff stat

`git diff --stat 2.0.0 2.3.0` will give me the diff like this:

```
 .circleci/config.yml                        |  154 ++-
 .github/CODEOWNERS                          |    2 +-
 .github/pull_request_template.md            |   33 +
 .github/stale.yml                           |   17 +
 .gitignore                                  |    7 +
 ...
```

On the left we see the file name. Next we see the pipe character, followed by the lines of code changed, and then a representation of how many of those were added lines and how many were removed lines.

**Filter out the directory**

In my case, all the tests are in the `Test/` directory. As such I pipe the diff stat to `grep -v 'Test/'` to filter out any files paths containing the string `Test/`. If you need to filter a different directory, this is the part of the command you would update.

**Extract the number of lines changed**

I take the part of the string after the `|` character via awk.

```
awk -F"|" '{ print $2 }'
```

Next I take the number:

```
awk '{ print $1 }'
```

**Remove any empty lines**

I strip out any empty lines with sed:

```
sed '/^$/d'
```

**Sum the numbers**

Finally I sum up all the numbers:

```
paste -sd+ - | bc
```

----

For the example in question the result of this command was "10745", meaning that out of the initial 32,551 changes reported by `git diff --shortstat` 10,745 of those were to files outside of the `Test/` directory.

This isn't the most elegant solution, but it works. If you know of a better way I'd love to hear it in the comments below.