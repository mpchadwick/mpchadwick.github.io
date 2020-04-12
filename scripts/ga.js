---
layout: null
---

{% if jekyll.environment == 'production' %}
  {% assign ga = site.ga.prod %}
{% else %}
  {% assign ga = site.ga.dev %}
{% endif %}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', '{{ ga }}', 'auto');

ga('send', 'pageview');

var tags = JSON.parse(document.getElementById('ga-tags').textContent);

if (Array.isArray(tags)) {
	tags.forEach(function(tag) {
		ga('send', 'event', 'taggedPost', 'view', tag, { nonInteraction: true });
	});
};
