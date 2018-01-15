---
layout: blog-single
title: Measuring round-trip time with nping
description: ping sends ICMP packets and can't get through many firewalls. nping is a part of the Nmap security scanner and can send TCP packets to a port of your choosing.
date: March 21, 2017
image: 
tags: [Networking]
ad: domain-clamp-ad-b.html
---

Recently, I was debugging a performance issue where a site was spending an above average amount of time running [`HGET`s](https://redis.io/commands/hget) against a Redis instance. I came upon this snippet of text from [Redis' benchmarking documentation](https://redis.io/topics/benchmarks#factors-impacting-redis-performance).

> Network bandwidth and latency usually have a direct impact on the performance. It is a good practice to use the ping program to quickly check the latency between the client and server hosts is normal before launching the benchmark
> 
> [https://redis.io/topics/benchmarks#factors-impacting-redis-performance](https://redis.io/topics/benchmarks#factors-impacting-redis-performance)

However when I went to ping the server running Redis I didn't have much luck...

```
$ ping -c 10 -W 1 172.24.16.119
PING 172.24.16.119 (172.24.16.119) 56(84) bytes of data.

--- 172.24.16.119 ping statistics ---
10 packets transmitted, 0 received, 100% packet loss, time 9999ms

```

<!-- excerpt_separator -->

[`ping`](https://en.wikipedia.org/wiki/Ping_(networking_utility)) operates by sending [ICMP](https://en.wikipedia.org/wiki/Internet_Control_Message_Protocol) echo packets to a host and measuring the time it takes to get back the response. Unfortunately, many firewalls block ICMP packets, which was the case here.

Fortunately, there are several alternatives which you can use to send TCP packets to your port of chosing. I recommend [`nping`](https://nmap.org/nping/), which is part of [Nmap](https://nmap.org/), a security scanning tool.

`nping` does not output in _exactly_ the same form as `ping`, but it's very similar.

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: In order to use <code>nping</code> in TCP mode you need to <code>sudo</code>.</p>
</div>

```
$ sudo nping --tcp -p 6379 -c 10 172.24.16.119

Starting Nping 0.5.51 ( http://nmap.org/nping ) at 2017-03-21 21:13 EDT
SENT (0.0191s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (0.0198s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=885804817 win=0
SENT (1.0193s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (1.0197s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=1708485529 win=0
SENT (2.0208s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (2.0213s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=1795782001 win=0
SENT (3.0225s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (3.0230s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=958728373 win=0
SENT (4.0241s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (4.0247s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=1716784081 win=0
SENT (5.0259s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (5.0264s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=242344193 win=0
SENT (6.0275s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (6.0280s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=915900691 win=0
SENT (7.0292s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (7.0298s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=1326783693 win=0
SENT (8.0309s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (8.0313s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=1502254247 win=0
SENT (9.0325s) TCP 172.24.32.118:13971 > 172.24.16.119:6379 S ttl=64 id=47276 iplen=40  seq=2983128163 win=1480
RCVD (9.0329s) TCP 172.24.16.119:6379 > 172.24.32.118:13971 RA ttl=63 id=0 iplen=40  seq=2102463273 win=0

Max rtt: 0.619ms | Min rtt: 0.330ms | Avg rtt: 0.459ms
Raw packets sent: 10 (400B) | Rcvd: 10 (460B) | Lost: 0 (0.00%)
Tx time: 9.01355s | Tx bytes/s: 44.38 | Tx pkts/s: 1.11
Rx time: 10.01494s | Rx bytes/s: 45.93 | Rx pkts/s: 1.00
Nping done: 1 IP address pinged in 10.05 seconds
```

As you can see it includes the fundamental piece we're looking for, the "Avg rtt".

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
