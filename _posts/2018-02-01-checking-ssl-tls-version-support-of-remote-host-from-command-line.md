---
layout: blog-single
title:  "Checking SSL / TLS Version Support of a Remote Host from the Command Line"
description: A look at various command line tools that can be used for checking SSL / TLS version support of a remote host.
date: February 01, 2018
image: 
tags: [Shell]
---

A few days back I received an alert from New Relic that a site was down.

I checked the New Relic UI for more details and saw the following...

<img
  class="rounded shadow"
  src="/img/blog/tls-version-support-command-line/new-relic-alert@1x.jpg"
  srcset="/img/blog/tls-version-support-command-line/new-relic-alert@1x.jpg 1x, /img/blog/tls-version-support-command-line/new-relic-alert@2x.jpg 2x"
  alt="New Relic Error">

"fatal alert: protocol_version" :open_mouth:

I did a little bit of research and found a question titled ["Availability report - connection error (Received fatal alert: protocol_version)"](https://discuss.newrelic.com/t/availability-report-connection-error-received-fatal-alert-protocol-version/52483) in the New Relic forums. There I found the following answer...

> The legacy Availability Monitor in APM only supports TLS 1.0 which is why it began throwing errors once you disabled older TLS protocols.
> 
> [https://discuss.newrelic.com/t/availability-report-connection-error-received-fatal-alert-protocol-version/52483/5](https://discuss.newrelic.com/t/availability-report-connection-error-received-fatal-alert-protocol-version/52483/5)

My next course of action was to check where or not the site in question supported TLS 1.0. In this post let's take a look at how we can do that.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: This post if focused on Unix systems. Windows is ignored.</p>
</div>

### openssl s_client

The simplest way to check support for a given version of SSL / TLS is via `openssl s_client`. openssl comes installed by default on most unix systems.

For the issue I was dealing with, checking was a matter of running the following command...

```
$ openssl s_client -connect www.example.com:443 -tls1
```

If the protocol is supported you'll see the remote host's certificate and the connection will remain open. At the time of writing this www.google.com supports TLS 1.0. Here's what happens when I run that command against www.google.com...(I've redacted the SSL-Session section because...paranoia...)

```
$ openssl s_client -connect www.google.com:443 -tls1
CONNECTED(00000005)
depth=2 C = US, O = GeoTrust Inc., CN = GeoTrust Global CA
verify error:num=20:unable to get local issuer certificate
verify return:0
---
Certificate chain
 0 s:/C=US/ST=California/L=Mountain View/O=Google Inc/CN=www.google.com
   i:/C=US/O=Google Inc/CN=Google Internet Authority G2
 1 s:/C=US/O=Google Inc/CN=Google Internet Authority G2
   i:/C=US/O=GeoTrust Inc./CN=GeoTrust Global CA
 2 s:/C=US/O=GeoTrust Inc./CN=GeoTrust Global CA
   i:/C=US/O=Equifax/OU=Equifax Secure Certificate Authority
---
Server certificate
-----BEGIN CERTIFICATE-----
MIIEdjCCA16gAwIBAgIIUHhcStTgTEwwDQYJKoZIhvcNAQELBQAwSTELMAkGA1UE
BhMCVVMxEzARBgNVBAoTCkdvb2dsZSBJbmMxJTAjBgNVBAMTHEdvb2dsZSBJbnRl
cm5ldCBBdXRob3JpdHkgRzIwHhcNMTgwMTE2MDg1NzMxWhcNMTgwNDEwMDg0MjAw
WjBoMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEWMBQGA1UEBwwN
TW91bnRhaW4gVmlldzETMBEGA1UECgwKR29vZ2xlIEluYzEXMBUGA1UEAwwOd3d3
Lmdvb2dsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDa7/L5
amnY7wapio5tS6wRg5ApLDr0jw3E9yIHj/WHVacPYXjZW8rCX8wVF2aEFvGxf+OY
siPaaGsdUi4NLKQZPi58tlQ3pEyxe7lX9DbOxaBiIwnKIUhNV5yWgTmciHJ+BGfs
JBfhOOWYqA2G/L/hZo0aKRPooEq3SKvOqcdB8poXBFtiNsJ1Q+WuPRyDrdXK+60q
rxgeVr8qZPIQJXZOaeaz5YgZG75W9iNC2WUdGkbuq5Wp2v0vLAzSlZ363gT9ZFD/
H8mJJ5JpO+9iC1AqeVxhdaj6PeMVvA4nNLU4u3aG+lmTMiTAnhTtdE91fo05jrx8
4uHiBF9JxZy9jbXrAgMBAAGjggFBMIIBPTATBgNVHSUEDDAKBggrBgEFBQcDATAZ
BgNVHREEEjAQgg53d3cuZ29vZ2xlLmNvbTBoBggrBgEFBQcBAQRcMFowKwYIKwYB
BQUHMAKGH2h0dHA6Ly9wa2kuZ29vZ2xlLmNvbS9HSUFHMi5jcnQwKwYIKwYBBQUH
MAGGH2h0dHA6Ly9jbGllbnRzMS5nb29nbGUuY29tL29jc3AwHQYDVR0OBBYEFMcE
jkZ9tW4nfomOiMHJ3qiZiOATMAwGA1UdEwEB/wQCMAAwHwYDVR0jBBgwFoAUSt0G
Fhu89mi1dvWBtrtiGrpagS8wIQYDVR0gBBowGDAMBgorBgEEAdZ5AgUBMAgGBmeB
DAECAjAwBgNVHR8EKTAnMCWgI6Ahhh9odHRwOi8vcGtpLmdvb2dsZS5jb20vR0lB
RzIuY3JsMA0GCSqGSIb3DQEBCwUAA4IBAQBKESXhISsT6zY8aX7z+18ERjDPQd3W
xt9W2lN5MspWearA3BUhOCoa1Pdd4afG65bqhzp6xVXyANb2KpE5Skb/erciaGo2
XstWAkUv4UgN/nnfxlbTTKgULjOdrI9H/x2d8g8mpdO6bV3r9qSzf67sHL6J7pwe
EyWg6PXIJfN5ewQonmz4isF9KDlMD2BkgyfnAo8cSzbwDKPfjzzf9WPk7BBiIMkH
CVGqGhTRKSnGchdvXBo+zla7TJJ1y9T7Khhl6M5fpr7DWoVIQKqFv/7O3IhFpkYG
XFMPjfaVZ1VRb5uBr0XJooxEsgqxcIEtPE2upmri/DshNS/i4B1fSTKQ
-----END CERTIFICATE-----
subject=/C=US/ST=California/L=Mountain View/O=Google Inc/CN=www.google.com
issuer=/C=US/O=Google Inc/CN=Google Internet Authority G2
---
No client certificate CA names sent
---
SSL handshake has read 3828 bytes and written 336 bytes
---
New, TLSv1/SSLv3, Cipher is ECDHE-RSA-AES128-SHA
Server public key is 2048 bit
Secure Renegotiation IS supported
Compression: NONE
Expansion: NONE
No ALPN negotiated
SSL-Session:
    Protocol  : TLSv1
    Cipher    : ECDHE-RSA-AES128-SHA
    ...

    Start Time: 1517539773
    Timeout   : 7200 (sec)
    Verify return code: 0 (ok)
---
```

If the protocol is not supported you'll see an error like this and the connection will close

```
140735577543560:error:1409442E:SSL routines:SSL3_READ_BYTES:tlsv1 alert protocol version:/BuildRoot/Library/Caches/com.apple.xbs/Sources/libressl/libressl-22/libressl/ssl/s3_pkt.c:1133:SSL alert number 70
140735577543560:error:1409E0E5:SSL routines:SSL3_WRITE_BYTES:ssl handshake failure:/BuildRoot/Library/Caches/com.apple.xbs/Sources/libressl/libressl-22/libressl/ssl/s3_pkt.c:522:
```
{:.wrap}

Checking other protocols is just a matter of changing the `-tls1` flag. Here's what the command looks like for other TLS versions...

#### TLS 1.1

```
$ openssl s_client -connect www.example.com:443 -tls1_1
```

#### TLS 1.2

```
$ openssl s_client -connect www.example.com:443 -tls1_2
```

You'll see `-ssl2` and `-ssl3` documented in a few places such as the blog post ["How Can I Determine What SSL/TLS Versions Are Available for HTTPS Communication?"](http://thenubbyadmin.com/2014/02/17/how-can-i-determine-what-ssltls-versions-are-available-for-https-communication/) on [The Nubby Admin](http://thenubbyadmin.com/) however, [openssl dropped support support these versions in newer versions](https://unix.stackexchange.com/a/281956).

### nmap ssl-enum-ciphers

Another option for checking SSL / TLS version support is nmap. nmap is *not* typically installed by default, so you'll need to manually install it. Once installed you can use the following command to check SSL / TLS version support...

```
$ nmap --script ssl-enum-ciphers -p 443 www.example.com
```

nmap's `ssl-enum-ciphers` script will not only check SSL / TLS version support for all version (TLS 1.0, TLS 1.1, and TLS 1.2) in one go, but will also check cipher support for each version including giving providing a grade. Here's what we see for www.google.com...

```
$ nmap --script ssl-enum-ciphers -p 443 www.google.com

Starting Nmap 7.40 ( https://nmap.org ) at 2018-02-01 22:03 EST
Nmap scan report for www.google.com (172.217.7.132)
Host is up (0.018s latency).
rDNS record for 172.217.7.132: iad30s08-in-f4.1e100.net
PORT    STATE SERVICE
443/tcp open  https
| ssl-enum-ciphers:
|   TLSv1.0:
|     ciphers:
|       TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA - unknown
|       TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA - unknown
|       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
|       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_3DES_EDE_CBC_SHA (rsa 2048) - C
|     compressors:
|       NULL
|     cipher preference: server
|     warnings:
|       64-bit block cipher 3DES vulnerable to SWEET32 attack
|   TLSv1.1:
|     ciphers:
|       TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA - unknown
|       TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA - unknown
|       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
|       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_3DES_EDE_CBC_SHA (rsa 2048) - C
|     compressors:
|       NULL
|     cipher preference: server
|     warnings:
|       64-bit block cipher 3DES vulnerable to SWEET32 attack
|   TLSv1.2:
|     ciphers:
|       TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 - unknown
|       TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256 - unknown
|       TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 - unknown
|       TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA - unknown
|       TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA - unknown
|       TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 (rsa 2048) - A
|       TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256 (rsa 2048) - A
|       TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 (rsa 2048) - A
|       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
|       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_AES_128_GCM_SHA256 (rsa 2048) - A
|       TLS_RSA_WITH_AES_256_GCM_SHA384 (rsa 2048) - A
|       TLS_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
|       TLS_RSA_WITH_3DES_EDE_CBC_SHA (rsa 2048) - C
|     compressors:
|       NULL
|     cipher preference: server
|     warnings:
|       64-bit block cipher 3DES vulnerable to SWEET32 attack
|_  least strength: unknown

Nmap done: 1 IP address (1 host up) scanned in 4.36 seconds
```

nmap ssl-enum-ciphers is convenient as it only takes a single command to get all this information, making nmap a worthwhile tool to install.