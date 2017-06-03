---
layout: blog-single
title: Scheduling tweets at specific times for twitter_ebooks bots
description: A guide on how to scheduler your twitter_ebooks bot to tweet on a specific schedule
date: June 02, 2017
image: /img/blog/twitter-bot-cron/640px-Bahnsteiguhr.jpg
tags: [twitter bot]
ad: domain-clamp-ad-b.html
---

In [the documentation for twitter_ebooks](https://github.com/mispy/twitter_ebooks/blob/75566103d45ef116a947aa8321304672e04af2b2/README.md#setting-up-a-bot) you'll see the following code.

```ruby
 def on_startup
  scheduler.every '24h' do
    # Tweet something every 24 hours
    # See https://github.com/jmettraux/rufus-scheduler
    # tweet("hi")
    # pictweet("hi", "cuteselfie.jpg")
  end
end
```

This will cause your ebooks_bot to tweet every 24 hours. However, what if you want your bot to Tweet at a specific schedule every day? We'll take a look at how to set that up here...

<!-- excerpt_separator -->

### Cron Expressions in Rufus Scheduler

In the code above, `scheduler` refers to an [a `Rufus::Scheduler` instance](https://github.com/jmettraux/rufus-scheduler) (as the comments suggest)

Rufus Scheduler supports cron expressions. For example, if you wanted your bot to tweet at 06:00 and 18:00 every day you'd just update as follows...

```ruby
def on_startup
  scheduler.cron '6,18 0 * * *' do
    tweet("hi")
  end
end
```

### A Note On Timezones

Rufus Scheduler also allows you to specify a timezone, which will override the server timezone. In my case, I want to tweet at New York time. Specifying a timezone is very simple...

```ruby
def on_startup
  scheduler.cron '6,18 0 * * * America/New_York' do
    tweet("hi")
  end
end
```
