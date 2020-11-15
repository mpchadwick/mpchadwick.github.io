---
title: pygments-high-contrast-stylesheets
position: 35
languages: CSS, Ruby
tags: Accessibility, Frontend
view_url: https://github.com/mpchadwick/pygments-high-contrast-stylesheets
call_to_action: View on GitHub
---

pygments-high-contrast-stylesheets is a hard fork of [pygments-css](https://github.com/richleland/pygments-css) with WCAG AA passing style sheets. I was inspired to build it when I ran a Lighthouse audit of this website and found that it failed the accessibility scan due insufficient color contrast in my highlighted coded blocks.

Initially I was [converting the color values by hand](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/commit/79298d962a76bdfcdeab9ae761066287ad5ee531), but later opted to build [a Ruby script](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/blob/c678dd005994a9807ded4ad2f88bf86679fb8d51/tools/make-stylesheet) to automate the process. It works by obtaining the background color from the source stylesheet, then iterates through each CSS selector to determine if the contrast is sufficient and adjust as needed by either lightening or darkening the color until it reaches WCAG AA compliance.

I also wrote [a Ruby script to generate a static HTML page with demos (in iframes) for each stylesheet converted](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/blob/c678dd005994a9807ded4ad2f88bf86679fb8d51/tools/make-demos).

Demos are published [here](https://maxchadwick.xyz/pygments-high-contrast-stylesheets/).
