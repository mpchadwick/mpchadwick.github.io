---
layout: blog-single
title: Adding a Content Security Policy (CSP) with Cloudflare Workers
date: April 11, 2020
image: /img/blog/cloudflare-worker-csp/cloudflare-worker-dashboard@2x.png
tags: [Security, Tools]
---

I had been interested in adding a Content Security Policy (CSP) to this website for a while. However, the site is built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub pages](https://pages.github.com/), which doesn't allow you to set custom HTTP response headers such as `Content-Security-Policy`<sup style="display: inline-block" id="a1">[1](#f1)</sup>. I did a bit of research and found it would be possible to add them through [Cloudflare](https://www.cloudflare.com/) (which I use as a CDN / DNS provider) via their "Cloudflare Workers" feature. In this post I want to walk through the setup process.

<!-- excerpt_separator -->

### Create the Worker

Visit the "Workers" tab within your Cloudflare account.

<img
  class="rounded shadow"
  src="/img/blog/cloudflare-worker-csp/cloudflare-worker-dashboard@1x.png"
  srcset="/img/blog/cloudflare-worker-csp/cloudflare-worker-dashboard@1x.png 1x, /img/blog/cloudflare-worker-csp/cloudflare-worker-dashboard@2x.png 2x"
  alt="Screenshot of Workers tab in Cloudflare Dashboard">
  
Click the "Manage Workers" button and then click "Create a Worker"

<div class="tout tout--secondary">
<p><b>NOTE:</b> Cloudflare will grant you 100,000 free worker requests per day</p>
</div>

The code for the worker (which is based on [the "Alter Headers" template](https://developers.cloudflare.com/workers/templates/pages/alter_headers/)) is as follows:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  let response = await fetch(request)

  response = new Response(response.body, response)

  response.headers.set(
    "Content-Security-Policy",
    "<<POLICY GOES HERE>>"
  )

  return response
}
```

Replace <<POLICY GOES HERE>> with your Content Security Policy.

<div class="tout tout--secondary">
<p><b>NOTE:</b> This site uses <code>Content-Security-Policy-Report-Only</code> to run in report only mode.</p>
</div>

### Create A Route For Your Worker

Back on the Workers dashboard click the "Add Route" button.

For this site the route is configured as follows:

<img
  class="rounded shadow"
  src="/img/blog/cloudflare-worker-csp/cloudflare-worker-route@1x.png"
  srcset="/img/blog/cloudflare-worker-csp/cloudflare-worker-route@1x.png 1x, /img/blog/cloudflare-worker-csp/cloudflare-worker-route@2x.png 2x"
  alt="Screenshot of how to configure route">

To give a quick summary:

- Configure your route using [Cloudflare's Matching Behavior syntax](https://developers.cloudflare.com/workers/about/routes/#matching-behavior)
- Select the Worker you just created
- Expand the "Request limit failure mode" accordion to configure Failure mode (You probably want "Fail open) so that users can continue to use your website if you run out of requests

One other recommendation is to add additional routes to prevent the CSP worker from processing requests for static assets.

For this website I have the following routes configured:

<img
  class="rounded shadow"
  src="/img/blog/cloudflare-worker-csp/cloudflare-worker-route-list@1x.png"
  srcset="/img/blog/cloudflare-worker-csp/cloudflare-worker-route-list@1x.png 1x, /img/blog/cloudflare-worker-csp/cloudflare-worker-route-list@2x.png 2x"
  alt="Screenshot showing the list of routes configured for this site">
  
### Footnotes

<b id="f1">1 </b>. Yes, I'm aware there is also a meta tag (although I only recently realized that as an option)[↩](#a1)