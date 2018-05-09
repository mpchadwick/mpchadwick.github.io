---
layout: blog-single
title:  "Inspecting Outbound Traffic to New Relic with tcpdump"
description: An example real world use case for tcpdump and details on how to use the tool.
date: May 08, 2018
image:
tags: [Shell, Tools, Networking]
---

`tcpdump` is a tool I reach for occasionally, but not on a daily basis by any means. As such, I always forget how to use it when I need it.

Most recently I was troubleshooting an issue where I couldn't see any data in [New Relic](https://newrelic.com/) for a website I help support at [Something Digital](https://www.somethingdigital.com/). The `newrelic-daemon` showed as running in the process list and no errors were reported in the logs, so one question I had was, is the server actually sending the data outbound to New Relic?

`tcpdump` is just the right tool to answer that question, so I decided to pull it out. Here I'll document how I answered the question as a reference for the next time I (or you :smile:) need to pull out `tcpdump`.

<!-- excerpt_separator -->

### Specifying The Network Interface

When running `tcpdump` the first thing to note is that you need to tell it which network interface's packets to dump. This is done via the `-i` flag. E.g...

```
$ sudo tcpdump -i eth0
```

The `ifconfig` command can be used to gather information about the network interfaces on a server. If you're not sure which network interface is handling the traffic you're looking to inspect you can also enter `any` to inspect traffic on all interfaces...

```
$ sudo tcpdump -i any
```

### Using Expressions To Filter Packets

`tcpdump` uses `pcap-filter` syntax to determine which packets to dump. According to [New Relic's documentation](https://docs.newrelic.com/docs/apm/new-relic-apm/getting-started/networks) their APM agents send data to the following networks...

- 50.31.164.0/24
-  162.247.240.0/22 

As such we can use the following command to inspect only packets back and forth between New Relic and any network interface...

```
$ sudo tcpdump -i any net 50.31.164.0/24 or 162.247.240.0/22 
```

This is shorthand for the more verbose syntax of...

```
$ sudo  tcpdump -i any net 50.31.164.0/24 or net 162.247.240.0/22 
```

We could whittle this down further by specifying that only outbound packets should be dumped by using `dst` ("destination")...

```
$ sudo tcpdump -i any dst net 50.31.164.0/24 or 162.247.240.0/22
```

If we wanted to only see inbound we'd replace `dst` with `src`.

```
$ sudo tcpdump -i any src net 50.31.164.0/24 or 162.247.240.0/22
```

### What About Filtering For Hosts?

We can also filter for specific hosts by replacing `net` with `host`

```
$ sudo tcpdump -i any host collector-4.newrelic.com or collector-5.newrelic.com
```

New Relic uses many subdomains matching the regex, `collector-\d\.newrelic\.com`, but unfortunately `tcpdump` does not support wildcards characters in hostnames such as `sudo tcpdump -i any host *.newrelic.com`

### Writing The Data To A File

By default, `tcpdump` will write it's data to `stdout`, however, the `-w` flag can be used to save the data to a file, which can be parsed using many tools such as [Wireshark](https://www.wireshark.org/). These files are traditionally given a `.pcap` file extension. Saving the New Relic data to a `.pcap` file looks something like this...

```
$ sudo tcpdump -i any -w newrelic.pcap net 50.31.164.0/24 or 162.247.240.0/22
```

If you're not restrictive with filter expression these pcap files and quickly get very large. As such, the `-c` flag is also useful for giving `tcpdump` a limit of how many packets to capture...

```
$ sudo tcpdump -i any -w newrelic.pcap -c 100 net 50.31.164.0/24 or 162.247.240.0/22
```

### Tools for analyzing pcap files

There plethora of tools for running analysis on pcap files. [Wireshark](https://www.wireshark.org/) is fairly popular GUI based one. [pcap2curl](https://github.com/jullrich/pcap2curl) also looks interesting.

### A Note on Encryption

It's worth noting that encrypted (TLS / SSL) packets can not be immediately analyzed. Wireshark provides [documentation on how you can provide it with the decryption key](https://wiki.wireshark.org/SSL), however I had issues making that work.

For encrypted traffic [`ssldump`](http://ssldump.sourceforge.net/) also looks interesting, although I haven't had a chance to play around with it at this point.