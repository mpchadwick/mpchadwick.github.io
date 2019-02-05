---
layout: blog-single
title:  "FCGI_PARAMS FastCGI record format"
description: "A quick description of the FCGI_PARAMS record format...so that you don't have to read the spec..."
date: February 04, 2019
image: /img/blog/fcgi-params/fcgi-params-record-in-wireshark@2x.jpg
tags: [Networking]
---

Recently I was trying [update Gopherus' FastCGI payload to clear PHP-FPM's `security.limit_extensions` value](https://github.com/tarunkant/Gopherus/issues/6). Using Wireshark I knew I needed to edit an `FCGI_PARAMS` record.

<img
  class="rounded shadow"
  src="/img/blog/fcgi-params/fcgi-params-record-in-wireshark@1x.jpg"
  srcset="/img/blog/fcgi-params/fcgi-params-record-in-wireshark@1x.jpg 1x, /img/blog/fcgi-params/fcgi-params-record-in-wireshark@2x.jpg 2x"
  alt="Screenshot showing an FCGI_PARAMS record in Wireshark">

However, no matter how much time I spent with Google I couldn't find a decent explanation of the format of a `FCGI_PARAMS` record.

Fortunately, after going through the a `FCGI_PARAMS` record byte-by-byte in Wireshark, I figured out what was going on. Here I'm documenting my findings for anyone else who finds them selves in the same shoes...

<!-- excerpt_separator -->

### How It Works

Let's look at the example again.

<img
  class="rounded shadow"
  src="/img/blog/fcgi-params/fcgi-params-name-value-pair-in-wireshark@1x.jpg"
  srcset="/img/blog/fcgi-params/fcgi-params-name-value-pair-in-wireshark@1x.jpg 1x, /img/blog/fcgi-params/fcgi-params-name-value-pair-in-wireshark@2x.jpg 2x"
  alt="Screenshot showing an FCGI_PARAMS name value pair  in Wireshark">

In Wireshark there are two bytes (`09` and `4b`) before the key / value pair (`PHP_VALUE = allow_url_include = On \ndisable_functions = \nauto_prepend_file = php://input`). What are they?

It turns out the first byte is the length of the key and the second byte is the length of the value.

- `PHP_VALUE` is 9 characters long in decimal, or `09` in hex.
- `allow_url_include = On \ndisable_functions = \nauto_prepend_file = php://input` is 75 characters long in decimal, or `4b` in hex.

The entire `Params` component of a `FCGI_PARAMS` record is made up of key / value pairs in this format.

### Actually Finding The Answer In The Spec.

It turns out this _is_ explained in in the spec:

> FastCGI transmits a name-value pair as the length of the name, followed by the length of the value, followed by the name, followed by the value.
> 
> [https://fastcgi-archives.github.io/FastCGI_Specification.html#34-name-value-pairs](https://fastcgi-archives.github.io/FastCGI_Specification.html#34-name-value-pairs)

Sometimes, specs can be a bit dense and difficult to extract information out of, so hopefully you found this blog post useful.
