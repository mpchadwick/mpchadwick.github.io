---
layout: blog-single
title:  "Concatenate a string and an int in Go"
description: "Exploring all the possible options for concatenating a string and an int in go"
date: May 24, 2019
image: 
tags: [Go, Golang]
---

Recently I needed to concatenate a string and an int in Go. Googling revealed an overwhelming number of options. I've gathered and organized all of them in this post, including full working examples for each.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><b>NOTE:</b> The examples concatenate the integer 1 with the string "bob@example.com" to form the string "1bob@example.com".</p>
</div>

### `fmt.Sprintf`

One option is to use [`fmt.Sprintf`](https://golang.org/pkg/fmt/#Sprintf). Implementation looks like this:

```go
package main

import (
	"fmt"
)

func main() {
	num := 1
	email := "bob@example.com"
	concatenated := fmt.Sprintf("%d%s", num, email)

	fmt.Println(concatenated)
}
```

### `fmt.Sprint`

I personally always forget the tokens to pass to `fmt.Sprintf`. [`fmt.Sprint`](https://golang.org/pkg/fmt/#Sprint) makes things easier:

```go
package main

import (
	"fmt"
)

func main() {
	num := 1
	email := "bob@example.com"
	concatenated := fmt.Sprint(num, email)

	fmt.Println(concatenated)
}
```

### `strconv.Itoa`

You can also use [`strconv.Itoa`](https://golang.org/pkg/strconv/#Itoa) to convert an int to a string. You can then concatenate with `+`. Coming from a PHP and JavaScript background I personally find this to be the most readable / understandable.

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	num := 1
	email := "bob@example.com"
	concatenated := strconv.Itoa(num) + email

	fmt.Println(concatenated)
}
```

I've also seen [suggestions](https://stackoverflow.com/a/35624701) to use [`strings.Join`](https://golang.org/pkg/strings/#Join) instead of `+`. I find this to be the least readable of the all the options but apparently it performs slightly better.

```go
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func main() {
	num := 1
	email := "bob@example.com"
	concatenated := strings.Join([]string{strconv.Itoa(num), email}, "")

	fmt.Println(concatenated)
}
```