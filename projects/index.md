---
layout: page
title: Projects
description: Things that I've worked on.
---
# Projects

### Domain Clamp

Domain Clamp is a SaaS app that monitors domains and SSL certificates and sends alerts when anything is soon to expire.

I was inspired to build Domain Clamp by my work at agencies, which are sometimes blamed for domains and SSL certificates that expire, even when those records are not in their names.

The app is mainly powered by Laravel and gets somehelp from AngularJS on the frontend, although it is not a truly "single page app".

I built the whole thing soup to nuts, including branding, page design, copywriting, front end development and backend development.

<a class="call-to-action" href="https://domainclamp.com">View the app</a>

### jQuery.nonSuckyYouTubeEmbed

jQuery.nonSuckyYouTubeEmbed is a jQuery plugin designed to improve front end performance when working with YouTube embeds.

The plugin works by fetching the fetching a thumbnail image and overlaying a play button, and replacing the thumbnail with the embedded YouTube iFrame when only when the user clicks the play button. This is important *always* but especially important for sites the embed multiple videos on a single page.

I also took a deep dive on YouTube embeds in [this blog post]({{site.url}}/blog/non-sucky-youtube-embed)

<a class="call-to-action" href="https://github.com/mpchadwick/jquery.nonSuckyYouTubeEmbed">View on GitHub</a>

### Mpchadwick_SearchAutocompleteConfigmarator

Mpchadwick_SearchAutocompleteConfigmarator is a Magento extension I built that enhances the functionality of Magento's out-of-the-box search autocomplete functionality.

It adds a few key features that are missing...

- On/off switch
- Result limit
- On/off switch for result count
- SQL `LIKE` match position

All these features can be configured through the admin panel (hence the "configmarator" name).

I was inspired to build this based on actual frustration I saw merchants having with the OOB functionality (especially the inability to control the result limit)

<a class="call-to-action" href="https://github.com/mpchadwick/Mpchadwick_SearchAutocompleteConfigmarator">View on GitHub</a>

### ruby-whois-api

ruby-whois-api is a basic Sinatra wrapper for the Ruby WHOIS gem.

My work on Domain Clamp forced me to do [a deep dive on WHOIS parsing]({{site.url}}/blog/dealing-with-whois-records) at which point it was pretty clear that the Ruby gem was the best solution available.

ruby-whois-api is a minimal web service that receives domain name and responds with a parsed WHOIS record.

<a class="call-to-action" href="https://github.com/mpchadwick/ruby-whois-api">View on GitHub</a>

### Mpchadwick_BigAssImageWarning

My most starred repo on GitHub, this is partially a joke, but I've seen cases where this type of thing is actually needed. This is a Magento extension, the idea behind which is to alert store admins if they upload an image that is bigger than a predetermined threshold.

While at Something Digital I had seen a store admin who will remain unnamed upload a 7.2MB image to a blog post, which prompted me to build this...

<a class="call-to-action" href="https://github.com/mpchadwick/Mpchadwick_BigAssImageWarning">View on GitHub</a>

---

## Open Source Contributions

I like to contribute back to the tools I use. Here are some of my open source contributions...

### PHP

- [Strip admin users when generating a development DB in n98-magerun2](https://github.com/netz98/n98-magerun2/pull/309)
- [Add Magento 1 SQL injection gadget to phpggc](https://github.com/ambionics/phpggc/pull/9)
- [Add Zend Framework 1 gadget to phpggc](https://github.com/ambionics/phpggc/pull/8)
- [Use `/usr/bin/env` to resolve PHP in phpggc](https://github.com/ambionics/phpggc/pull/5)
- [Add Auto Expiry Feature to Redis cache backend library](https://github.com/colinmollenhour/Cm_Cache_Backend_Redis/pull/111)
- [Fix timeout so that it can actually be configured in Redis session library](https://github.com/colinmollenhour/Cm_RedisSession/pull/86)
- [Allow passing arguments to `<options>` methods in Magento Grid Control module](https://github.com/magento-hackathon/GridControl/pull/19)

### JavaScript

- [Refactor bindRemoveButtons for improved performance in Magento 2](https://github.com/magento/magento2/pull/1144)
- [Add a filter to hide silenced alerts in Prometheus Alert Manager](https://github.com/prometheus/alertmanager/pull/319)
- [Add option to show percentage in legend to Grafana Piechart Panel plugin](https://github.com/grafana/piechart-panel/pull/41)

### Go

- [Add ability to log alerts in Chronograf](https://github.com/influxdata/chronograf/pull/1477)
- [Move SMTP auth to the config file in Prometheus Alertmanager](https://github.com/prometheus/alertmanager/pull/308)

### Ruby

- [Add .xyz parser to whois gem](https://github.com/weppos/whois/pull/460)

### DevOps

- [Allow vagrant up with no sites in Laravel Homestead](https://github.com/laravel/homestead/pull/326)

---

## Talks

Here's a list of talks I've given...

- [**Mage Titans USA**](https://usa.magetitans.com/) - [Imagining a World Without Caching](https://usa.magetitans.com/speakers/max-chadwick/), September 15, 2017
- [**NYC Magento Meetup**](https://www.meetup.com/NYC-Magento-Developers/) - [Imagining a World Without Caching](https://www.meetup.com/NYC-Magento-Developers/events/242254135/), August 24, 2017
- [**Nomad Mage**](https://nomadmage.com/) - [Imagining a World Without Caching](https://nomadmage.com/product/imagining-world-without-caching/), July 18, 2017
- [**NYC Magento Meetup**](https://www.meetup.com/NYC-Magento-Developers/) - [Monitoring (and improving) Your Full Page Cache Hit Rate with Enterprise_PageCache](https://www.meetup.com/NYC-Magento-Developers/events/233797698/), September 29, 2016
- [**Nomad Mage**](https://nomadmage.com/) - [Monitoring (and improving) Your Full Page Cache Hit Rate with Enterprise_PageCache](https://nomadmage.com/product/monitoring-improving-full-page-cache-hit-rate-enterprise_pagecache/), August 16, 2016
