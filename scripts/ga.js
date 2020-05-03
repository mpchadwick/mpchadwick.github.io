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

try {
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      ga('send', 'timing', {
        'timingCategory': 'Paint',
        'timingVar': entry.name,
        'timingValue': Math.round(entry.startTime)
      });
    }
  });
  paintObserver.observe({
    type: 'paint',
    buffered: true
  });

  let lcp;
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];

    // Update `lcp` to the latest value, using `renderTime` if it's available,
    // otherwise using `loadTime`. (Note: `renderTime` may not be available if
    // the element is an image and it's loaded cross-origin without the
    // `Timing-Allow-Origin` header.)
    lcp = lastEntry.renderTime || lastEntry.loadTime;
  });

  lcpObserver.observe({
    type: 'largest-contentful-paint',
    buffered: true
  });

  addEventListener('visibilitychange', function fn() {
    if (lcp && document.visibilityState === 'hidden') {
      ga('send', 'timing', {
        'timingCategory': 'Paint',
        'timingVar': 'largest-contentful-paint',
        'timingValue': Math.round(lcp)
      })
      removeEventListener('visibilitychange', fn, true);
    }
  }, true);
} catch (e) {
  // Do nothing if the browser doesn't support this API
}
