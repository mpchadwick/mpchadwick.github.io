---
layout: blog-single
title:  "Inspecting FastCGI Packets with Wireshark"
description: "Everything you need to know that's missing from the Wireshark wiki."
date: January 30, 2019
image: /img/blog/fastcgi-wireshark/wireshark-fastcgi-packets-with-fastcgi-info@2x.png
tags: [Networking, Tools]
---

Recently I needed to do [some analysis](https://github.com/tarunkant/Gopherus/issues/5#issuecomment-458804375) on FastCGI packets being sent to PHP-FPM.

Wireshark has a page on their wiki titled [FastCGI](https://wiki.wireshark.org/FastCGI) which shows a screenshot of a pcap in Wireshark with detailed FastCGI info.

<img
  class="rounded shadow"
  src="/img/blog/fastcgi-wireshark/wireshark-fcgi.png"
  alt="Image from Wireshark FastCGI Wiki showing pcap with detailed FastCGI info">

However, I couldn't easily figure out from the wiki how to get the same details on my FastCGI pcap.

<img
  class="rounded shadow"
  src="/img/blog/fastcgi-wireshark/fastcgi-packet-without-fastcgi-info@1x.png"
  srcset="/img/blog/fastcgi-wireshark/fastcgi-packet-without-fastcgi-info@1x.png 1x, /img/blog/fastcgi-wireshark/fastcgi-packet-without-fastcgi-info@2x.png 2x"
  alt="Screenshot showing a FastCGI pcap in Wireshark without proper FastCGI info">

<!-- excerpt_separator -->

After reading, re-reading and clicking through Wireshark's menus I was able to figure it out. Here's what you need to do:

### 1. Set FastCGI as an "Enabled Protocol"

In my Wireshark installation this can be done by clicking "Enabled Protocols" under the "Analyze" menu.

Find "FCGI" and make sure it is checked.

<img
  class="rounded shadow"
  src="/img/blog/fastcgi-wireshark/wireshark-enabled-protocols@1x.jpg"
  srcset="/img/blog/fastcgi-wireshark/wireshark-enabled-protocols@1x.jpg 1x, /img/blog/fastcgi-wireshark/wireshark-enabled-protocols@2x.jpg 2x"
  alt="Wireshark's Enabled Protocols menu">

### 2. Configure the FCGI TCP Port

For me this can be done by clicking "Preferences" under the "Wireshark" menu.

Expand the "Protocols" list and scroll down to FCGI. Then set the value to the port your FastCGI service was running on (in my case 9000).

<img
  class="rounded shadow"
  src="/img/blog/fastcgi-wireshark/wireshark-tcp-port-for-fastcgi@1x.png"
  srcset="/img/blog/fastcgi-wireshark/wireshark-tcp-port-for-fastcgi@1x.png 1x, /img/blog/fastcgi-wireshark/wireshark-tcp-port-for-fastcgi@2x.png 2x"
  alt="Wireshark's Enabled Protocols menu">

Click "OK" and voila, your pcap should now show detailed FastCGI info.

<img
  class="rounded shadow"
  src="/img/blog/fastcgi-wireshark/wireshark-fastcgi-packets-with-fastcgi-info@1x.png"
  srcset="/img/blog/fastcgi-wireshark/wireshark-fastcgi-packets-with-fastcgi-info@1x.png 1x, /img/blog/fastcgi-wireshark/wireshark-fastcgi-packets-with-fastcgi-info@2x.png 2x"
  alt="FastCGI packets with FastCGI info in Wireshark">