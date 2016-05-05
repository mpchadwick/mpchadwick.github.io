---
layout: blog-single
title: "[PROPOSAL] Script Tag Timeout Attribute"
date: May 02, 2016
comments: true
noNameInTitle: true
---

Marketing `<script>` tags. Some might say they power the internet. 

There are all different kinds of marketing `<script>` tags. There are simple ones that you just embed in the global footer and are done with. Then, there are complex ones that fire when a user "converts" and ask you to send back the total order amount, a list of products, tax and shipping costs and the user's mother's maiden name. 

Adding and removing these tags is such a common task for any website that there are entire platforms (see: [Google Tag Manager](https://www.google.com/analytics/tag-manager/)) created just for the point of doing so. They introduce a new knowledge domain and buzzwords like *data layer*.

That's all fine and dandy, but what happens when they don't work? Below is a story where a marketing pixel caused a big problem, and a proposal for how we can help makes these backbones of the internet a little less dangerous.

<!-- excerpt_separator -->

### What Happened?

The story starts with an alert. Specifically a [Pingdom](http://www.pingdom.com) alert. 

One fine afternoon an alert came in for a [transaction check](https://www.pingdom.com/product/transaction-monitoring) that was supposed to navigate to and load web page, and then confirm that a certain string of text did *not* exist in the document. Sounds simple enough, right? Unfortunately, the alert didn't quite agree.

Looking into this, we found that Pingdom said the request was timing out. Odd, I just hit the page and it seemed to load pretty quickly for me.

![](/img/blog/timeout/root-cause-analysis.png)

Digging in further, I checked New Relic and saw that page load time was through the roof (although server response time was completely flat). I popped open Chrome developer tools and instantly saw the problem.

Basically, what was happening was that there was a marketing tag from a source that will go unamed on the site that was hanging, and then eventually timing out after 30 seconds.

Apparently, the Pingdom check didn't want to wait 30 seconds for the window's `load` event to fire  (rightfully so) and thus complained to us about the issue.

### Why Is This A Problem?

There are many reasons waiting 30 seconds for a marketing tag to timeout is bad news. As mentioned above, the window's `load` event will not fire until the tag times out. As a result...

- There could be some other JavaScript (hopefully not, but there might be) on the page that is waiting for that event to fire before executing. So it could noticably block things for the user, even if you `async` it.
- Browsers continue to show the loading spinner to the user until the window's `load` event fires. As result, the user will not be told that the page is "loaded" by the browser until the tag times out.
- Analytics and monitoring platforms often use the `load` event for performance metrics. We saw browser throughput plummet and response time skyrocket as reported by New Relic, for example. I didn't look at other platforms such as Google Analytics or AdWords, but things like that could be affected as well.
- It can set off alarms and wake up your on call developer for a pretty stupid reason.

### OK, I'm Sold. So What Are The Solutions?
  
Unfortunately, currently, there aren't really any great ones that I know of.

Initially, I thought that maybe embedding the tags in Google Tag Manager (GTM) would solve this problem. Unfortunately I was wrong.

![](/img/blog/timeout/gtm-badtime.gif)

Doing some research, I found there is [quite](http://stackoverflow.com/questions/2021157/any-way-to-gracefully-enforce-a-timeout-limit-when-loading-a-slow-external-file#answer-2021439) [a](http://stackoverflow.com/questions/5506425/how-to-set-a-timeout-for-loading-a-external-javascript-file-which-is-down?rq=1) [bit](http://stackoverflow.com/questions/1018705/how-to-detect-timeout-on-an-ajax-xmlhttprequest-call-in-the-browser?lq=1) [of](http://gabrieleromanato.name/javascript-set-a-timeout-for-blocking-scripts/) [chatter](https://www.peterbe.com/plog/never-put-external-javascript-in-the-head) related to topic, but not really any great solutions. Currently, it seems like the only feasible (but totally undesirable) way to handle is to proxy the requests for `<script>` assets through some server side code which can determine whether or not to timeout the request.

### There's Got To Be A Better Way!

> **NOTE**: This is theoretical and doesn't actually exist yet.

Meet the `timeout` attribute.

The idea is simple. Similar to `async` or `defer` you add this attribute to the script tag and it becomes a bit more safe. With `async` you can be sure your marketing tag won't completely block everything, however you *can't* be sure it won't block the window `load` event from firing.

Simply add your script like this and the browser will cancel the request, if it hasn't received a response for the requested asset after the specified duration.

```
<script async src="http://example.com/risky.js" timeout="3s"></script>
```

### Can We Just Write a Timeout.js Polyfill?

This was my first question when I got the idea for the `timeout` attribute. For example, what would happen if we put this all the way at the top?

```js
var loaded = [];

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        var node = mutation.addedNodes[0];
        if (!node || node.tagName !== 'SCRIPT') {
            return;
        }

        node.onload = function() {
            loaded.push(node.src);
        }

        if (node.attributes.timeout) {
            setTimeout(function() {
                if (loaded.indexOf(node.src) !== -1) {
                    return;
                }

                node.remove();
            }, node.attributes.timeout.value);
        }
    })
});

var config = {
    childList: true,
    subtree: true
};

observer.observe(document.documentElement, config);
```

Unfortunately, this doesn't work.

The issue is that removing a script from the document doesn't actually cancel the request. So, it seems that this cannot be implemented through a polyfill and will require actual adoption standards folks and browser authors.

### What's Next

Well, I wrote this post about it, and am planning to do what I can to spread the word. If you feel like this is something that would be useful in the HTML spec I'd encourage you to do the same. Then, maybe one day, `timeout` can become a thing and we can add marketing tags to our sites with a little less danger.
