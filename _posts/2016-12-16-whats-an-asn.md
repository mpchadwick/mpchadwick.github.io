---
layout: blog-single
title: What's an ASN?
description: A review of AS numbers and a discussion about why it's a useful concept to understand for application developers.
date: December 16, 2016
image:
tags: [Networking]
ad: domain-clamp-ad-b.html
---

In [a recent blog post](/blog/what-is-cidr-notation), I mentioned that I had learned about [CIDR notation](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing#CIDR_notation) while mitigating malicious website activity that originated from a range of IP addresses. Another networking concept that I learned about at that time is [ASNs (Autonomous System Numbers)](http://www.iana.org/assignments/as-numbers/as-numbers.xhtml). 

In this post, I'll explain what ASNs are, and offer a few tidbits on how to make use of them.

<!-- excerpt_separator -->

### The Definition

ASNs are numbers used for identifying Internet service providers (ISPs), a.k.a Autonomous Systems (ASs). [The IANA](http://www.iana.org/) provides blocks of them to [regional Internet registries](https://en.wikipedia.org/wiki/Regional_Internet_registry) who in turn assign the numbers to the appropriate local ISPs. They looks like this.

> Organization:   Cloudflare, Inc. (CLOUD14)
> 
> OriginAS:       AS13335

Initially ASNs were intended to be only 16 bits in length for a range of 0 to 65,535. However, as demand increased beyond original projections, a new spec was introduced to allow 32 bit ASNs expanding the range up to 4,294,967,295.

### Finding the ASN For A Given IP Address

Typically you can find the ASN of an IP address with [`whois`](http://www.manpagez.com/man/1/whois/). For example if you [`dig`](https://linux.die.net/man/1/dig) maxchadwick.xyz you'll see that I have an A record pointing to 104.18.41.207.

```
$ dig maxchadwick.xyz

; <<>> DiG 9.8.3-P1 <<>> maxchadwick.xyz
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 63698
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;maxchadwick.xyz.		IN	A

;; ANSWER SECTION:
maxchadwick.xyz.	300	IN	A	104.18.41.207
maxchadwick.xyz.	300	IN	A	104.18.40.207

;; Query time: 20 msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
;; WHEN: Fri Dec 16 21:25:58 2016
;; MSG SIZE  rcvd: 65
```

Running `whois` against that IP address provides a lot of information, including the ASN (listed as "OriginAS").

```
$ whois 104.18.41.207

NetRange:       104.16.0.0 - 104.31.255.255
CIDR:           104.16.0.0/12
NetName:        CLOUDFLARENET
NetHandle:      NET-104-16-0-0-1
Parent:         NET104 (NET-104-0-0-0-0)
NetType:        Direct Assignment
OriginAS:       AS13335
Organization:   Cloudflare, Inc. (CLOUD14)
RegDate:        2014-03-28
Updated:        2015-10-01
Comment:        https://www.cloudflare.com
Ref:            https://whois.arin.net/rest/net/NET-104-16-0-0-1

OrgName:        Cloudflare, Inc.
OrgId:          CLOUD14
Address:        101 Townsend Street
City:           San Francisco
StateProv:      CA
PostalCode:     94107
Country:        US
RegDate:        2010-07-09
Updated:        2016-11-22
Comment:        http://www.cloudflare.com/
Ref:            https://whois.arin.net/rest/org/CLOUD14

OrgNOCHandle: NOC11962-ARIN
OrgNOCName:   NOC
OrgNOCPhone:  +1-650-319-8930
OrgNOCEmail:  noc@cloudflare.com
OrgNOCRef:    https://whois.arin.net/rest/poc/NOC11962-ARIN

OrgTechHandle: ADMIN2521-ARIN
OrgTechName:   Admin
OrgTechPhone:  +1-650-319-8930
OrgTechEmail:  admin@cloudflare.com
OrgTechRef:    https://whois.arin.net/rest/poc/ADMIN2521-ARIN

OrgAbuseHandle: ABUSE2916-ARIN
OrgAbuseName:   Abuse
OrgAbusePhone:  +1-650-319-8930
OrgAbuseEmail:  abuse@cloudflare.com
OrgAbuseRef:    https://whois.arin.net/rest/poc/ABUSE2916-ARIN

RAbuseHandle: ABUSE2916-ARIN
RAbuseName:   Abuse
RAbusePhone:  +1-650-319-8930
RAbuseEmail:  abuse@cloudflare.com
RAbuseRef:    https://whois.arin.net/rest/poc/ABUSE2916-ARIN

RNOCHandle: NOC11962-ARIN
RNOCName:   NOC
RNOCPhone:  +1-650-319-8930
RNOCEmail:  noc@cloudflare.com
RNOCRef:    https://whois.arin.net/rest/poc/NOC11962-ARIN

RTechHandle: ADMIN2521-ARIN
RTechName:   Admin
RTechPhone:  +1-650-319-8930
RTechEmail:  admin@cloudflare.com
RTechRef:    https://whois.arin.net/rest/poc/ADMIN2521-ARIN
```

If you don't specify a host (via the `-h` flag) when running `whois` it will query [ARIN](https://www.arin.net/)'s database. I've found that in some cases ARIN does not return an ASN. In that case, I've found [Cymru's IP to ASN lookup tool](https://asn.cymru.com/cgi-bin/whois.cgi) to be a useful tool.

### Finding All IP Addresses Controlled By An ASN

This question was asked (and answered) in [this StackExchange thread](http://superuser.com/questions/405666/how-to-find-out-all-ip-ranges-belonging-to-a-certain-as). [This answer](http://superuser.com/questions/405666/how-to-find-out-all-ip-ranges-belonging-to-a-certain-as#answer-978189) includes a bash one-liner. For example, we can see the first 10 found networks that belong to Cloudflare (in CIDR notation) as follows.

```
$ whois -h whois.radb.net -- '-i origin AS13335' | grep -Eo "([0-9.]+){4}/[0-9]+" | head
64.68.192.0/24
141.101.68.0/24
141.101.69.0/24
188.114.96.0/22
188.114.100.0/22
188.114.104.0/24
188.114.106.0/24
188.114.107.0/24
188.114.108.0/22
185.122.2.0/24
```

Remove `head` to get them all :rainbow:

### Blocking The Bad Guys

There is also [a StackExchange thread covering this question](http://superuser.com/questions/810853/how-do-i-block-a-host-by-asn-example-as16276). I haven't personally tested it, but [`mod_asn`](http://mirrorbrain.org/mod_asn/) referenced in [this answer](http://superuser.com/questions/810853/how-do-i-block-a-host-by-asn-example-as16276#answer-810864) looks very interesting to me.

### Conclusion

I certainly don't claim to be a networking guru, so it's not unlikely that I got some things wrong above. Corrections and comments are certainly appreciated! Feel free to drop a note comments below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
