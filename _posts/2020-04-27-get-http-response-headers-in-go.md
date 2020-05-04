---
layout: blog-single
title: Get HTTP Response Headers in Go
date: April 27, 2020
image: 
tags: [Go, Golang]
---

The [Theory and Practice](https://siongui.github.io/) blog has a nice example of [accessing HTTP Response Headers in Go](https://siongui.github.io/2018/03/06/go-print-http-response-header/).

The example provided shows how we can a loop through the `Header` map and print each key and value. One thing that wasn't immediately clear to me was the best way to access a specific header, without the loop.

I did a bit of research and found the [`Get` function](https://golang.org/pkg/net/http/#Header.Get) was helpful here.

<!-- excerpt_separator -->

Here's an example of accessing the `Content-Security-Policy` header:

```go
resp, err := http.Get(url)
if err != nil {
    log.Fatal(err)
}

fmt.Println(resp.Header.Get("Content-Security-Policy"))
```

It's worth noting that `Header` is actually the following type:

`map[string][]string`

This is because a server can issue the same response header multiple times. In this case, `Get` will return the first value.

The entire slice of values can be accessed directly by key:

```
values := resp.Header["Content-Security-Policy"]
```