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

---

## Talks

<div class="embed-container" style="margin-bottom: 10px;">
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/tmOJxIyjvcQ"
  srcdoc="<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img,span{position:absolute;width:100%;top:0;bottom:0;margin:auto}span{height:1.5em;text-align:center;font:48px/1.5 sans-serif;color:white;text-shadow:0 0 0.5em black}</style><a href=https://www.youtube.com/embed/tmOJxIyjvcQ?autoplay=1><img src=https://img.youtube.com/vi/tmOJxIyjvcQ/maxresdefault.jpg alt='Imagining A Magento World Without Caching | Max Chadwick | Meet Magento New York'><span>▶</span></a>"
  frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="Imagining A Magento World Without Caching | Max Chadwick | Meet Magento New York"
></iframe>
</div>

<p><em>Delivery of my talk "Imagining A World Without Caching" at Meet Magento NY 2017</em></p>

Here's a list of talks I've given...

{% for talk in site.data.talks %}

- [**{{- talk.event_name }}**]({{ talk.event_url }}) - [{{ talk.talk_name }}{% if talk.url_is_video %} &#128249;{% endif %}]({{ talk.talk_url }}), {{ talk.date }}

{% endfor %}

Here's are links to my slides

{% for slide in site.data.slides %}

- [{{ slide.title }}]({{ slide.link }})

{% endfor %}
