---
layout: page
title: Projects
description: Things I've built, open source contributions I've made and talks I've given.
redirect_from:
  - /projects/
---

# Projects

{% assign sorted_projects = site.projects | sort: 'position' %}

{% for project in sorted_projects %}

## {{ project.title }}

{{ project.content }}

{% endfor %}

---

## Open Source Contributions

I like to contribute back to the tools I use. Here are some of my open source contributions...

### PHP

- [Report Handled Exceptions To New Relic in Magento 2](https://github.com/magento/magento2/pull/11944)
- [Add Role column to admin user grid in Magento 2](https://github.com/magento/magento2/pull/10891#issuecomment-332806807)
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

### Ruby

- [Add the ability to return relative luminance in wcag_color_contrast](https://github.com/mkdynamic/wcag_color_contrast/pull/2)
- [Add .xyz parser to whois gem](https://github.com/weppos/whois/pull/460)
- [Create a TLD subfolder when using mkwhois in whois-parser](https://github.com/weppos/whois-parser/pull/3/files)


### Go

- [Add ability to log alerts in Chronograf](https://github.com/influxdata/chronograf/pull/1477)
- [Move SMTP auth to the config file in Prometheus Alertmanager](https://github.com/prometheus/alertmanager/pull/308)

### DevOps

- [Allow vagrant up with no sites in Laravel Homestead](https://github.com/laravel/homestead/pull/326)

### Docs

- [Mention utils/mkwhois.rb in CONTRIBUTING.md in whois gem](https://github.com/weppos/whois-parser/pull/4)

### ETC

- [Retain additional cron history by default in Magento 2](https://github.com/magento/magento2/pull/11463)

---

## Talks

Here's a list of talks I've given...

{% for talk in site.data.talks %}
- [**{{- talk.event_name }}**]({{ talk.event_url }}) - [{{ talk.talk_name }}]({{ talk.talk_url }}), {{ talk.date }}
{% endfor %}

