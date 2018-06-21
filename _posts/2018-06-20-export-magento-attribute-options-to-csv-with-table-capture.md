---
layout: blog-single
title:  "Export Magento Attribute Options to CSV with the Table Capture Chrome Extension"
description: How I solved attribute option export from Magento with no coding using the Table Capture Chrome Extension.
date: June 20, 2018
image: /img/blog/export-magento-attribute-options/table-capture@2x.png
tags: [Magento]
---

Recently, I received the following request from a client...

> How can I get an export of all the options for a given attribute in Magento?
> 
> There are several attributes I need to do this for...

Looking at the Magento admin panel, it quickly became evident that there was no self-serve way for the client to export the data.

<img
  class="rounded shadow"
  src="/img/blog/export-magento-attribute-options/attribute-option-edit-screen@1x.jpg"
  srcset="/img/blog/export-magento-attribute-options/attribute-option-edit-screen@1x.jpg 1x, /img/blog/export-magento-attribute-options/attribute-option-edit-screen@2x.jpg 2x"
  alt="The attribute option edit screen in Magento 1">

Here I'll document my approach, which ultimately led me to [the Table Capture Chrome extension](https://chrome.google.com/webstore/detail/table-capture/iebpjdmgckacbodjpijphcplhebcmeop?hl=en).

<!-- excerpt_separator -->

### Can I Just Copy / Paste It?

The first thing I tried was to simply copy / paste the data from the web page into Excel.

As you can see below, that didn't work out too well...

<img
  class="rounded shadow"
  src="/img/blog/export-magento-attribute-options/pasting-to-excel@1x.jpg"
  srcset="/img/blog/export-magento-attribute-options/pasting-to-excel@1x.jpg 1x, /img/blog/export-magento-attribute-options/pasting-to-excel@2x.jpg 2x"
  alt="The result of pasting the data to Excel">

### Use A Script?

I did some quick Googling and found [a script](https://gist.github.com/peterjaap/7892509) published by [Peter Jaap](https://twitter.com/peterjaap?lang=en) that would generate an export of all attributes and attribute options in a given Magento system. While this was nice, this script would set me down one of the following paths...

1. Run it as a one-off and provide the output to the client. This would mean if they needed the data again at some point in the future they would need to contact me and I'd then run the script for them again.
2. Wrap the script in some sort of controller layer that could be used on demand by the client. This would require coding / code review, QA, UAT and deployment.

Neither of these solutions seemed ideal.

### Scraping The HTML?

The idea suddenly popped in my head - this data is just in an HTML table, I wonder if there's some way to just scrape if from the browser and get it into CSV format. My initial thought was to try to write some JavaScript that the client could run in the console, but this wasn't a particularly technically savvy client, and I wasn't sure how well that would go over.

Then, I had another idea - I wonder if there's a browser extension that could be installed to do exactly this?

### Looking For A Browser Extension

Another quick round Googling later I found [the "Table Capture" Chrome extension](https://chrome.google.com/webstore/detail/table-capture/iebpjdmgckacbodjpijphcplhebcmeop?hl=en). I did some quick testing and found that it could do exactly what the client was asking. It works something like this...

- While viewing any page click the Table Capture icon in the browser
- A menu flies out listing each `<table>` element on the page.
- Next to each listing there are two icons, one to copy as CSV to the clipboard and the other to open in Google sheets.
- Use these features as needed to grab the desired data.

<img
  class="rounded shadow"
  src="/img/blog/export-magento-attribute-options/table-capture@1x.png"
  srcset="/img/blog/export-magento-attribute-options/table-capture@1x.png 1x, /img/blog/export-magento-attribute-options/table-capture@2x.png 2x"
  alt="A screenshot demonstrating the Table Capture functionality">

I sent the client these instructions along with some screenshots demonstrating how to use the tool. I heard back shortly thereafter from the client this solution worked perfectly for their needs.

Request resolved, no coding required. Mission accomplished :raised_hands: