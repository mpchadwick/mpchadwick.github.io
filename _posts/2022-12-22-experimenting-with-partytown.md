---
layout: blog-single
title:  "Experimenting with Partytown"
date: December 22, 2022
image: 
tags: [Performance, Tools]
related_posts:
---

A couple weeks back in a Twitter conversation I learned about [Partytown](https://partytown.builder.io/).

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Would you try to leverage the script off the main thread with Partytown?<br>Didn&#39;t use myself yet. Curious about your result.<a href="https://t.co/49ifl6QX7I">https://t.co/49ifl6QX7I</a></p>&mdash; Denis Metzler (@DenisMetzler) <a href="https://twitter.com/DenisMetzler/status/1602584859104481282?ref_src=twsrc%5Etfw">December 13, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I was immediately intrigued by the idea and saw great potential, especially on the ecommerce projects that I work on on a daily basis.

Today I spent some time playing with Partytown. In this post I'll share my process and findings.

### Methodology

For my use-case I was looking to quickly test some potential performance optimizations against a remote website that I didn't have a copy of running locally. The website was running Adobe Commerce (a.k.a. Magento) on the Adobe Commerce Cloud infrastructure. 

Running this type of testing is a task that comes up somewhat frequently for me and my current favorite way to do this is using Chrome developer tools [local overrides](https://developer.chrome.com/blog/new-in-devtools-65/#overrides).

Partytown publishes some [documentation](https://partytown.builder.io/html) on how to integrate into plain old HTML although I did find it a bit confusing. Here's what I wound up doing.

### Get a copy of the Partytown code

First we get a copy of the Partytown code

```
# Make a random temporary folder
mkdir test && cd test

# Install Partytown
npm install @builder.io/partytown

# Use partytown copylib to obtain the code for web publishing
# Partytown wants to use ~partytown as the directory name
# but the ~ in the folder name needs to be escaped and is annoying
node node_modules/@builder.io/partytown/bin/partytown.cjs copylib partytown
```

Now your `partytown` directory should look something like this...

```
partytown
├── debug
│   ├── partytown-atomics.js
│   ├── partytown-media.js
│   ├── partytown-sandbox-sw.js
│   ├── partytown-sw.js
│   ├── partytown-ww-atomics.js
│   ├── partytown-ww-sw.js
│   └── partytown.js
├── partytown-atomics.js
├── partytown-media.js
├── partytown-sw.js
└── partytown.js
```

### Upload the code to the remote server

Per the Partytown documentation, the code needs to be hosted from the origin domain. I attempted to simpy drop my `partytown` directory into my local overrides folder for the website, however Chrome was complaining that the service worker file wasn't being loaded with the correct MIME type. To get around this I just uploaded the files to the remote server (maybe there's a better way to do this?).

On Adobe Commerce Cloud was can drop them into the `pub/media` folder.

```
# Zip up the code
zip -r partytown.zip partytown

# scp it up
scp partytown.zip user@host:~/pub/media

# SSH in and unzip it
ssh user@host
cd pub/media
unzip partytown
```

### Add The Partytown Snippet to the head

Using local overrides inline the snippet into the `<head>` of the document. This will look something like this.

Note that we have to manually replace `/~partytown` with `/media/partytown`.

```html
<script>
/* Partytown 0.7.3 - MIT builder.io */
!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,"/"==(a=(o.lib||"/media/partytown/")+(o.debug?"debug/":""))[0]&&(s=e.querySelectorAll('script[type="text/partytown"]'),i!=t?i.dispatchEvent(new CustomEvent("pt1",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener("pt0",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||"partytown-sw.js"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener("statechange",(function(t){"activated"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?"script":"iframe"),t||(c.setAttribute("style","display:block;width:0;height:0;border:0;visibility:hidden"),c.setAttribute("aria-hidden",!0)),c.src=a+"partytown-"+(t?"atomics.js?v=0.7.3":"sandbox-sw.html?"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement("script")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(".").map((function(e,n,i){p=p[i[n]]=n+1<i.length?"push"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),"complete"==e.readyState?u():(t.addEventListener("DOMContentLoaded",u),t.addEventListener("load",u))}(window,document,navigator,top,window.crossOriginIsolated);
</script>
```
{:.wrap} 

### Test your optimizations

Before making any changes, use Chrome developer tools and run a lighthouse scan.

Next identify some potential problematic third-party scripts. Add the `type="text/partytown"` attribute to those scripts in your local override. Then re-run the Lighthouse score to observe the impact.

## My findings

I tested this on a client staging site today and had very positive results:

### Initial Metrics

- **TBT** - 2,250ms
- **Third party blocking time** - 970ms

### Accessibe snippet moved to Partytown

- **TBT** - 1,950ms
- **Third party blocking time** -  640ms

### Accessibe + Grin snippets moved to Partytown

- **TBT** - 1,420ms
- **Third party blocking time** - 680ms (I don't think Lighthouse knows that Grin is 3rd party)

### Accessibe + Grin + PowerReviews moved to Partytown

- **TBT** - 620ms
- **Third party blocking time** - 270ms

## Conclusion

I've just scratched the surface so far with Partytown, but am very excited about the positive performance improvements it can offer for many websites (especially ecommerce). Hope you found this article helpful!