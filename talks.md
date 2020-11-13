---
layout: page
title: Talks
description: Talks I've given
---

# Talks

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