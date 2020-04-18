---
layout: blog-single
title: Generating a CSP Hash at the CLI
date: April 17, 2020
image: 
tags: [Security]
---

I'm currently attempting to set up a Content-Security-Policy on this site in [strict-dynamic](https://websec.be/blog/cspstrictdynamic/) mode. As this is a static site, nonces are not an option for me, so I'm looking into using hashes. I was pulling my out hair earlier this evening trying to figure out how to generate the hashes in the correct CSP format at the command line. I finally figured it out piecing together various bits of information and wanted to share my findings here.

<!-- excerpt_separator -->

### If You Just Want The Answer

This blog post will tell the story and explain what's going on. If you're not interested in all I'm putting the answer up front:

```
$ echo -n 'alert(1);' | shasum -a 256 | cut -d' ' -f1 | xxd -r -p | base64
5jFwrAK0UV47oFbVg/iCCBbxD8X1w+QvoOUepu4C2YA=
```

If you want to know more, please continue to read

### ReportURI's Web UI

ReportURI offers a nice [web-based tool for generating CSP hashes](https://report-uri.com/home/hash).

Here's a screenshot of the output for `alert(1);` 

<img
  class="rounded shadow"
  src="/img/blog/csp-hash-cli/report-uri-hash-generator@1x.png"
  srcset="/img/blog/csp-hash-cli/report-uri-hash-generator@1x.png 1x, /img/blog/csp-hash-cli/report-uri-hash-generator@2x.png 2x"
  alt="Screenshot showing value of alert(1); hashing to 5jFwrAK0UV47oFbVg/iCCBbxD8X1w+QvoOUepu4C2YA= using ReportURI hasher">

As you'd expect, the tool generates the hashes correctly.

### Doing it at the CLI - First Try

Per [MDN's script-src documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) we need to generate a "base64-encoded hash"

At first glance that seems like it shouldn't be too bad. This is what I initially came up with:

```
$ echo -n 'alert(1);' | shasum -a 256 | cut -d' ' -f1 | base64
ZTYzMTcwYWMwMmI0NTE1ZTNiYTA1NmQ1ODNmODgyMDgxNmYxMGZjNWY1YzNlNDJmYTBlNTFlYTZlZTAyZDk4MAo=
```

However, as you'll notice by comparing against the output from ReportURI, this is not the expected value.

### Digging Deeper

After a bit more research I found [another web UI that generates CSP hashes](https://zinoui.com/tools/csp-hash). This one also provided the following example PHP source code for generating CSP hashes:

```php
<?php
$algo = 'sha256';
$data = "console.log('Hello World');"; # This is your inline JS/CSS without the <script>/<style> tags
$base64 = base64_encode(hash($algo, $data, true));
echo "$algo-$base64";
# sha256-4saCEHt0PuLiuYPF+oVKJcY5vrrl+WqXYIoq3HAH4vg=
?>
```

The thing that caught my eye here was the third argument being passed to the PHP `hash` function. Per the PHP documentation:

> When set to TRUE, outputs raw binary data. FALSE outputs lowercase hexits.
> 
> [https://www.php.net/manual/en/function.hash.php](https://www.php.net/manual/en/function.hash.php)

A-ha! `shasum` wasn't outputting raw binary data, but instead a hex representation.

From what I could tell from `shasum`'s man page, there's no option to output as binary, however [this StackExchange answer](https://superuser.com/a/1368206) gave me the idea to use `xxd`.

The below command ultimately generates the hash in the correct format for usage in a CSP.

```
$ echo -n 'alert(1);' | shasum -a 256 | cut -d' ' -f1 | xxd -r -p | base64
5jFwrAK0UV47oFbVg/iCCBbxD8X1w+QvoOUepu4C2YA=
```