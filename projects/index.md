---
layout: page
title: Projects
---
# Projects

##Domain Clamp
Domain Clamp is a SaaS app that monitors domains and SSL certificates and sends alerts when anything is soon to expire.

I was inspired to build Domain Clamp by my work at agencies, which are sometimes blamed for domains and SSL certificates that expire, even when those records are not in their names.

The app is mainly powered by Laravel and gets somehelp from AngularJS on the frontend, although it is not a truly "single page app".

I build the whole thing soup to nuts, including branding, page design, copywriting, front end development and backend development.

<a class="call-to-action" href="https://domainclamp.com">View the app</a>

## jQuery.nonSuckyYouTubeEmbed

jQuery.nonSuckyYouTubeEmbed is a jQuery plugin designed to improve front end performance when working with YouTube embeds.

The plugin works by fetching the fetching a thumbnail image and overlaying a play button, and replacing the thumbnail with the embedded YouTube iFrame when only when the user clicks the play button. This is important *always* but especially important for sites the embed multiple videos on a single page.

I also took a deep dive on YouTube embed in [this blog post](http://maxchadwick.xyz/blog/non-sucky-youtube-embed/)

<a class="call-to-action" href="https://github.com/mpchadwick/jquery.nonSuckyYouTubeEmbed">View on GitHub</a>

## Mpchadwick_SearchAutocompleteConfigmarator

Mpchadwick_SearchAutocompleteConfigmarator is a Magento extension I built that enhances the functionality of Magento's out-of-the-box search autocomplete functionality.

It adds a few key features that are missing...

- On/off switch
- Result limit
- On/off switch for result count
- SQL `LIKE` match position

All these features can be configured through the admin panel (hence the "configmarator" name).

I was inspired to build this based on actual frustration I saw merchants having with the OOB functionality (especially the inability to control the result limit)

<a class="call-to-action" href="https://github.com/mpchadwick/Mpchadwick_SearchAutocompleteConfigmarator">View on GitHub</a>

## ruby-whois-api

ruby-whois-api is a basic Sinatra wrapper for the Ruby WHOIS gem.

My work on Domain Clamp forced me to do [a deep dive on WHOIS parsing](http://maxchadwick.xyz/blog/dealing-with-whois-records/) at which point it was pretty clear that the Ruby gem was the best solution available.

ruby-whois-api is a minimal web service that receives domain name and responds with a parsed WHOIS record.

<a class="call-to-action" href="https://github.com/mpchadwick/ruby-whois-api">View on GitHub</a>

## Mpchadwick_BigAssImageWarning

My most starred repo on GitHub, this is partially a joke, but I've seen cases where this type of thing is actually needed. This is a Magento extension, the idea behind which is to alert store admins if they upload an image that is bigger than a predetermined threshold.

While at Something Digital I had seen a store admin who will remain unnamed upload a 7.2MB image to a blog post, which prompted me to build this...

<a class="call-to-action" href="https://github.com/mpchadwick/Mpchadwick_BigAssImageWarning">View on GitHub</a>
