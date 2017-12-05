---
layout: blog-single
title:  Etiquette When Addressing Code Review Comments
description: Some etiquette suggestions to keep in mind when addressing code review comments
date: December 04, 2017
image: 
tags: [Thoughts]
---

Code review etiquette is an interesting subject. 

A few months back [an article was published to CSS-Tricks titled "Code Review Etiquette"](https://css-tricks.com/code-review-etiquette/). It outlines some general pointers for reviewers to keep in mind when doing code reviews. 

In this post, I'll make some etiquette suggestions that apply to a more specific part of the code review process...addressing code review comments.

We'll look at this from the perspective of both the reviewer and the contributor.

<!-- excerpt_separator -->

### What to do as a Contributor when you've addressed all the Reviewer's comments...

As a contributor, after you've addressed all the comments from code review and pushed your code make sure to notify the reviewer that the code is ready for another round of review.

Without such a notification, the reviewer has no way of knowing if the code you pushed is still a work-in-progress or the finished product. The reviewer's only option at this point is to manually reconcile the code you pushed against the comments and make assumptions about the status of the work, which is both inefficient and error-prone.

In GitHub the best way notify the reviewer is to leave a comment on the pull request stating it's ready for another round of review and "@" the reviewer.

<img
  class="rounded shadow"
  src="/img/blog/responding-to-code-review/ready-for-another-round@1x.jpg"
  srcset="/img/blog/responding-to-code-review/ready-for-another-round@1x.jpg 1x, /img/blog/responding-to-code-review/ready-for-another-round@2x.jpg 2x"
  alt="500 Error">


### What to do as a Reviewer after you've left comments...

On the flip side of this, as a reviewer, if you see code pushes from the contributor, resist the urge to review and comment on them until the contributor sends a notification that the code is ready for review another round of review. 

The code that was pushed may still be in progress and the review may be pointless if the author was planning to further adjust the code. Also, if you're commenting on code that's still in progress, it can become very distracting for the contributor to read through and consider those comments while in the midst addressing the original comments received.

### Exceptions to the rule

The exception to this rule is if the contributor is confused by the reviewer's comments and further discussion or clarification is needed. 

In this case the contributor should notify the reviewer that they are confused by some of the comments. Ideally the discussion would live within GitHub (or where ever the code review is happening) for documentation sake, but sometimes chat, phone or face-to-face conversation is a better medium for such discussion. In these cases it's always ideal to write up a recap of these discussions and add it source code hosting platform where the review is happening.

### Conclusion

In this post I've outlined a few simple techniques that can be used to smooth out the code review process. I hope you incorporate these into your project or at your organization.