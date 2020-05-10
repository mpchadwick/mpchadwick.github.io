---
layout: null
---

// https://gist.github.com/jed/982883
const uuid = function b(a) {
  return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) :
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
};

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

// Hit ID
ga('set', 'dimension1', uuid());

var tags = JSON.parse(document.getElementById('ga-tags').textContent);

if (Array.isArray(tags)) {
	tags.forEach(function(tag) {
		ga('send', 'event', 'taggedPost', 'view', tag, { nonInteraction: true });
	});
};

function sendToGoogleAnalytics({name, delta, id}) {
  ga('send', 'event', {
    eventCategory: 'Web Vitals',
    eventAction: name,
    eventValue: Math.round(name === 'CLS' ? delta * 1000 : delta),
    eventLabel: id,
    nonInteraction: true,
  });
}

import {getTTFB, getCLS, getFID, getFCP, getLCP} from './web-vitals.es5.min.js';

getTTFB(sendToGoogleAnalytics);
getCLS(sendToGoogleAnalytics);
getFID(sendToGoogleAnalytics);
getFCP(sendToGoogleAnalytics);
getLCP(sendToGoogleAnalytics);