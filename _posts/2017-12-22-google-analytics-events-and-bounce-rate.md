---
layout: blog-single
title:  Google Analytics Events & Bounce Rate
description: Event Tracking is a useful Google Analytics feature. However, before using it, it's important to understand how it impacts bounce rate.
date: December 22, 2017
image: 
tags: [Google Analytics]
---

[Event Tracking](https://developers.google.com/analytics/devguides/collection/analyticsjs/events) is a useful Google Analytics feature for recording miscellaneous information about how visitors interact with a website. 

For example, on this site I [use a "taggedPost" event to understand my most popular blog topics]({{ site.baseurl }}{% link _posts/2017-08-07-tracking-your-most-popular-blog-post-tags-in-google-analytics-with-jekyll.md %}) by firing an event to report back any tags (e.g. "Security", "Performance", "Google Analytics") associated with a given page. 

However, when I first set this up, one thing that I didn't understand was the impact that firing events has on bounce rate. 

<!-- excerpt_separator -->

This is documented in the "Implementation Considerations" section of [Google's "About Events" help article](https://support.google.com/analytics/answer/1033068#Implementation)...

> If you implement Event Tracking for your site, you might notice a change in bounce rate metrics. This is because Event Tracking, like page tracking is classified as an interaction request.

In other words, by default, if a user visits a page and an event fires, that visit is no longer seen as a bounce, even if the visitor leaves your site without visiting any other pages.

This can be avoided, however, by declaring that the event is a "non-interaction event"

On the same help article there is [a section titled "Non-Interaction Events"](https://support.google.com/analytics/answer/1033068#NonInteractionEvents) which documents this...

> When this value is set to true, the type of event hit is not considered an interaction hit. You can use this fact to adjust bounce rate calculations for pages that contain events.
 
From a coding standpoint, implementing a non-interaction event looks something like this...

```javascript
ga('send', 'event', 'taggedPost', 'view', 'Google Analytics', { nonInteraction: true });
```

For my use case the "taggedPost" event fires immediately when the user visits the page, guaranteeing a 0% bounce rate if the nonInteraction flag is not set. As such, upon learning this I promptly updated this site to set "taggedPost" as a non-interaction event.