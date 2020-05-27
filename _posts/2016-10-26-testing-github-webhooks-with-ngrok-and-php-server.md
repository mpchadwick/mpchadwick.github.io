---
layout: blog-single
title: "[Screencast] Testing GitHub Webhooks with Ngrok and PHP's built-in web server"
description: We take a look at how Ngrok can be used to forward Github webhooks to PHP's built-in server, running on localhost.
date: October 26, 2016
tags: [Tools]
---

I recently heard about [Ngrok on The Changelog podcast](http://5by5.tv/changelog/210). It sounded cool at the time, although I wasn't exactly sure what I would need it for.

Then, when [the new GitHub projects feature](https://help.github.com/articles/tracking-the-progress-of-your-work-with-projects/) was announced I started thinking about how we could start using that to manage statuses of individual tasks and have it update the ticketing system we use at work. While, unfortunately, Github projects doesn't seem to support webhooks when moving cards between columns at this time, I still had some fun setting up Ngrok and directing Github webhooks to my local computer. In the end, I decided to record a screencast so you can get started playing with these fun tools too.

<!-- excerpt_separator -->

<div class="embed-container">
<iframe
  src="https://www.youtube.com/embed/pVmtNH51mSE"
  srcdoc="<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img,span{position:absolute;width:100%;top:0;bottom:0;margin:auto}span{height:1.5em;text-align:center;font:48px/1.5 sans-serif;color:white;text-shadow:0 0 0.5em black}</style><a href=https://www.youtube.com/embed/pVmtNH51mSE?autoplay=1><img src=https://img.youtube.com/vi/pVmtNH51mSE/maxresdefault.jpg alt='Testing GitHub Webhooks Locally with Ngrok and PHP's Built In Webserver'><span>▶</span></a>"
  frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="Testing GitHub Webhooks Locally with Ngrok and PHP's Built In Webserver"
></iframe>
</div>

### Conclusion

As always, feel free to leave any thoughts in the comments below or reach out to me on [Twitter](http://twitter.com/maxpchadwick).
