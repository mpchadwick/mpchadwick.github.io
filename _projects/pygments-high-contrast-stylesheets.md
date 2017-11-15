---
title: pygments-high-contrast-stylesheets
position: 350
languages: CSS, Ruby
tags: Accessibility, Frontend
---

pygments-high-contrast-stylesheets is a hard fork of [pygments-css](https://github.com/richleland/pygments-css) with WCAG AA passing style sheets.

Stylesheets are processed by [this Ruby script](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/blob/c678dd005994a9807ded4ad2f88bf86679fb8d51/tools/make-stylesheet) which obtains the background color from the source stylesheet, then iterates through each CSS selector to determine if the contrast is sufficient and adjust as needed by either lightening or darkening the color.

I also wrote [a Ruby script to generate a static HTML page with demos (in iframes) for each stylesheet converted](https://github.com/mpchadwick/pygments-high-contrast-stylesheets/blob/c678dd005994a9807ded4ad2f88bf86679fb8d51/tools/make-demos).

Demos are published [here](https://maxchadwick.xyz/pygments-high-contrast-stylesheets/).

<a class="call-to-action" href="https://github.com/mpchadwick/pygments-high-contrast-stylesheets">View on GitHub</a>
