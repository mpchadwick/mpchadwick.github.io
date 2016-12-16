---
layout: blog-single
title: What Is CIDR Notation?
description: A review of what CIDR notation is and a discussion about why it's a useful concept to understand for application developers.
date: December 15, 2016
image:
tags: [networking]
ad: domain-clamp-ad-b.html
---

Recently, I was involved in mitigating malicious scripted activity against a site that was found to be coming from a range of IP addresses. [`whois`](http://www.manpagez.com/man/1/whois/) is a useful tool when dealing with this type of an issue. It can provide a network range for a given IP address.

```
➜  ~ whois 104.232.39.143

NetRange:       104.232.32.0 - 104.232.47.255
CIDR:           104.232.32.0/20
NetName:        NET3-INC
NetHandle:      NET-104-232-32-0-1
Parent:         NET104 (NET-104-0-0-0-0)
NetType:        Direct Allocation
OriginAS:       AS36352, AS62584, AS55286
Organization:   Net3 Inc. (NETIN-11)
RegDate:        2014-10-27
Updated:        2014-10-27
Ref:            https://whois.arin.net/rest/net/NET-104-232-32-0-1


OrgName:        Net3 Inc.
OrgId:          NETIN-11
Address:        8195 Sheridan Drive
City:           Buffalo
StateProv:      NY
PostalCode:     14221
Country:        US
RegDate:        2013-07-10
Updated:        2015-08-14
Ref:            https://whois.arin.net/rest/org/NETIN-11


OrgTechHandle: NOC13226-ARIN
OrgTechName:   Network Operations Center
OrgTechPhone:  +1-289-408-9989
OrgTechEmail:  netops@net3.co
OrgTechRef:    https://whois.arin.net/rest/poc/NOC13226-ARIN

OrgAbuseHandle: NOC13226-ARIN
OrgAbuseName:   Network Operations Center
OrgAbusePhone:  +1-289-408-9989
OrgAbuseEmail:  netops@net3.co
OrgAbuseRef:    https://whois.arin.net/rest/poc/NOC13226-ARIN

OrgNOCHandle: NOC13226-ARIN
OrgNOCName:   Network Operations Center
OrgNOCPhone:  +1-289-408-9989
OrgNOCEmail:  netops@net3.co
OrgNOCRef:    https://whois.arin.net/rest/poc/NOC13226-ARIN
```

 I provided the range of IP addresses (104.232.32.0 - 104.232.47.255) to the hosting company to block at the firewall. However, in their correspondence, they began referring to the IP address range in a way I wasn't familiar with. It looked like this:
 
104.232.32.0/20. 
 
Curious as always, I did a little investigation and found out that this way of referring to networks is called [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) notation. I became interested and decided to learn a little more about CIDR notation...what is it used for and why? Here, I'll share my learnings for anyone else who is curious.
 
<!-- excerpt_separator -->
 
### What Is CIDR Notation?

> **NOTE:** We will only be talking about IPv4 in this post.
>
> **ALSO:** This post doesn't go into detail on how CIDR notation is calculated. I recommend [this post](https://www.digitalocean.com/community/tutorials/understanding-ip-addresses-subnets-and-cidr-notation-for-networking) if that's what you're after.

In order to answer this question, it's helpful to have a basic understanding of IP addresses and IP address classes.

The total range of possible IPv4 addresses spans from 0.0.0.0 to 255.255.255.255. This range is divided up into a number of classes

##### Class A: 0.0.0.0 - 127.255.255.255.  

For these IP addresses the first "octet" (set of numbers before the dot) is intended to refer to the network. The last 3 octets refer to the host. Class A IP addresses allow for only a few networks, but allow each network to have a massive amount of hosts.

##### Class B: 128.0.0.0 to 191.255.255.255. 

In class of IP addresses the first two octets refers to the network and the last 2 octets refer to the host.

##### Class C: 192.0.0.0 to 223.255.255.255

In this class of IP addresses the first 3 octets refer to the network and the last octet refers to the host. Each network can only have 255 hosts on this type of network.

IP addresses above 223.255.255.255 are split into Class C and D, however those classes are used for multi-casting protocols and experimental use

### What Does This Have To Do With CIDR Notation?

To understand why CIDR notation exists you need to understand the problems that the class based IP routing system introduce. Namely it doesn't adapt to the needs to actual real word networks. Class C networks can have 254 hosts, Class B networks, 65534 and Class A networks 16,777,214. Those are the only options. There are many networks that don't fit into these moulds leading to many wasted IP addresses. In order so solve this subnetting was introduced as a technique for more control over network division.

### I'm Still Not Following

CIDR notation is basically a way of referring to a subnet. For example, let's take a look at the IP address range in question again: 104.232.32.0 - 104.232.47.255
 
These are Class A addresses. In this case 104 should be the network and all the other numbers should refer to the host. However, there aren't that many networks that have 16,777,214 hosts, so 104 was sub-divided into a number of smaller networks of which 104.232.32.0 - 104.232.47.255 is one. CIDR notation is a way to reference these subnets. 

This is done by providing an IP address separated by a slash, and then (this next part's tricky) the number of bits that reference the network portion of the address when the IP address is written in binary. As mentioned, I'm not going to go into detail on how that is actually calculated, just explain at a high level the purpose of this notation.
 
### Why Should I Care About This About CIDR Notation?
 
If you work in business of keeping applications available online it is good to have some understanding of basic networking concepts. For example, your site may come under attack by a malicious network and you may work with a network engineer to resolve the issue.

Further, CIDR notation may enter your world beyond the firewall such as with [mod_authz_host for Apache](http://httpd.apache.org/docs/2.2/mod/mod_authz_host.html) which lets you deny (or allow) networks using CIDR notation.

### Tools

Here are some tools and resources that I found useful learning about CIDR notation.

- [A calculator that will take an IP address range and give it back to you in CIDR notation](http://www.ipaddressguide.com/cidr)
- [whatmask](http://www.laffeycomputer.com/whatmask.html) - A CLI tool that gives you some information on networks. The hosting company had posted the output of this tool for the CIDR notation of the network I requested to be blacklisted
- [Digital Ocean's excellent guide on IP Addresses, Subnets and CIDR Notation](https://www.digitalocean.com/community/tutorials/understanding-ip-addresses-subnets-and-cidr-notation-for-networking)

### Conclusion

I certainly don't claim to be a networking guru, so it's not unlikely that I got some things wrong above. Corrections and comments are certainly appreciated! Feel free to drop a note comments below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.