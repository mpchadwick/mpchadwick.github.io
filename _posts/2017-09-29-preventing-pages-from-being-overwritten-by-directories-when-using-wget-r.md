---
layout: blog-single
title:  Preventing Pages From Being Overwritten By Directories When Using wget -r
description: By default wget -r can overwrite pages with directories. This post outlines a solution for dealing with that.
date: September 29, 2017
image: /img/blog/wget-r-overwriting/wget-r.jpg
tags: [Shell, Tools]
---

When you envoke `wget` with the `-r` flag it will attempt to clone an entire website...a handy feature. However, by default you can end up with some pages being overwritten by directories. 

Here, we'll investigate the problem in more detail and lay out a solution.

<!-- excerpt_separator -->

### The Problem

Imagine you were cloning a website with the following structure

```
$ tree
.
├── example
│   ├── details
│   │   └── index.html
│   └── index.html
└── index.html

2 directories, 3 files
```

On this website the root index.html file is as follows...

```
$ cat index.html
HOME

<a href="/example">Example</a>
<a href='/example/details'>Example Details</a>
```

Here's what will happen if you `wget -r` this site...

```
$ wget -r http://localhost:1234
--2017-09-29 08:06:06--  http://localhost:1234/
Resolving localhost... 127.0.0.1, ::1, fe80::1
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 200 OK
Length: 84 [text/html]
Saving to: 'localhost:1234/index.html'

localhost:1234/index.html     100%[=================================================>]      84  --.-KB/s    in 0s

2017-09-29 08:06:06 (20.0 MB/s) - 'localhost:1234/index.html' saved [84/84]

Loading robots.txt; please ignore errors.
--2017-09-29 08:06:06--  http://localhost:1234/robots.txt
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 404 Not Found
2017-09-29 08:06:06 ERROR 404: Not Found.

--2017-09-29 08:06:06--  http://localhost:1234/example
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 200 OK
Length: 0 [text/html]
Saving to: 'localhost:1234/example'

localhost:1234/example            [ <=>                                              ]       0  --.-KB/s    in 0s

2017-09-29 08:06:06 (0.00 B/s) - 'localhost:1234/example' saved [0/0]

--2017-09-29 08:06:06--  http://localhost:1234/example/details
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 200 OK
Length: 0 [text/html]
Saving to: 'localhost:1234/example/details'

localhost:1234/example/detail     [ <=>                                              ]       0  --.-KB/s    in 0s

2017-09-29 08:06:06 (0.00 B/s) - 'localhost:1234/example/details' saved [0/0]

FINISHED --2017-09-29 08:06:06--
Total wall clock time: 0.02s
Downloaded: 3 files, 84 in 0s (20.0 MB/s)
```

If we look at what at the directory created by `wget -r` we can see the issue...

```
$ tree
.
├── example
│   └── details
└── index.html

1 directory, 2 files
```

We're missing `./example/index.html`. This is because `wget` initially cloned it as `./example` but subsequently overwrote that file to convert it to a directory to house `./example/details`.

### How To Solve This

Reviewing the `man` pages for `wget` there are a few interesting options. The one that is most interesting to me is `-E / --adjust-extension`.

> If a file of type application/xhtml+xml or text/html is downloaded and the URL does not end with the regexp \.[Hh][Tt][Mm][Ll]?, this option will cause the suffix .html to be appended to the local filename.

Let's try that again with the `-E` flag...

```
$ wget -r http://localhost:1234 --adjust-extension
--2017-09-29 08:12:10--  http://localhost:1234/
Resolving localhost... 127.0.0.1, ::1, fe80::1
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 200 OK
Length: 84 [text/html]
Saving to: 'localhost:1234/index.html'

localhost:1234/index.html     100%[=================================================>]      84  --.-KB/s    in 0s

2017-09-29 08:12:10 (20.0 MB/s) - 'localhost:1234/index.html' saved [84/84]

Loading robots.txt; please ignore errors.
--2017-09-29 08:12:10--  http://localhost:1234/robots.txt
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 404 Not Found
2017-09-29 08:12:10 ERROR 404: Not Found.

--2017-09-29 08:12:10--  http://localhost:1234/example
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 200 OK
Length: 0 [text/html]
Saving to: 'localhost:1234/example.html'

localhost:1234/example.html       [ <=>                                              ]       0  --.-KB/s    in 0s

2017-09-29 08:12:10 (0.00 B/s) - 'localhost:1234/example.html' saved [0/0]

--2017-09-29 08:12:10--  http://localhost:1234/example/details
Connecting to localhost|127.0.0.1|:1234... connected.
HTTP request sent, awaiting response... 200 OK
Length: 0 [text/html]
Saving to: 'localhost:1234/example/details.html'

localhost:1234/example/detail     [ <=>                                              ]       0  --.-KB/s    in 0s

2017-09-29 08:12:10 (0.00 B/s) - 'localhost:1234/example/details.html' saved [0/0]

FINISHED --2017-09-29 08:12:10--
Total wall clock time: 0.02s
Downloaded: 3 files, 84 in 0s (20.0 MB/s)
```

Here's the result...

```
$ tree
.
├── example
│   └── details.html
├── example.html
└── index.html

1 directory, 3 files
```

As you can see, now, instead of downloading `./example/index.html` as `./example`, `wget` saved it as `./example.html`. As a result, when it went to create the `./example` directory for `./example/details/index.html` it did not overwrite `./example/index.html` with a directory.

Hope this was helpful!