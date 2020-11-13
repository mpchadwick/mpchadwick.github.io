---
layout: page
title: Projects
description: Things I've built, open source contributions I've made and talks I've given.
body-class: projects
---

# Open Source

<div class="tout tout--secondary">
<p>In my spare time I like to build and publish open source software. Here are some of the things I've built</p>
</div>

{% assign sorted_projects = site.projects | sort: 'position' %}

{% for project in sorted_projects %}

<h2 id="{{ project.title | slugify }}">{{ project.title }}</h2>

{{ project.content }}

<a href="{{ project.view_url }}" class="call-to-action">{{ project.call_to_action }}</a>

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