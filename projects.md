---
layout: page
title: Projects
description: Things I've built, open source contributions I've made and talks I've given.
body-class: projects
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

{% assign types = site.data.open_source_contributions | group_by: 'type' | sort: 'size' %}

{% for type in types reversed %}

### {{ type.name }}

{% for item in type.items %}

- [{{ item.title }} in {{ item.project }}]({{ item.link }})

{% endfor %}

{% endfor %}

---

## Talks

Here's a list of talks I've given...

{% for talk in site.data.talks %}

- [**{{- talk.event_name }}**]({{ talk.event_url }}) - [{{ talk.talk_name }}]({{ talk.talk_url }}), {{ talk.date }}

{% endfor %}

