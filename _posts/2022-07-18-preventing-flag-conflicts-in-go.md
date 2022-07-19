---
layout: blog-single
title:  "Preventing Flag Conflicts in Go"
date: July 18, 2022
image: 
tags: [Go]
related_posts:
- "Testing Log Output in Go with logrus"
- "Get HTTP Response Headers in Go"
- "Concatenate a string and an int in Go"
---

After `import`-ing a new package into one of my go projects and attempting to run the build, I was presented the following error:

```
panic: flag redefined: version
```

In my project, the `version` flag allows the user to see what version of the tool they have installed (`main.version` is passed as the current git tag via `-ldflags` in the build script).

```go
package main

import (
	"flag"
	"fmt"
)

var version string

func main() {
	ver := flag.Bool("version", false, "Get current version")
	flag.Parse()

	if *ver {
		fmt.Println(ver)
	}
}
```

Presumably, the problem was that the newly imported package also used a flag with the same name.

<!-- excerpt_separator -->

The first solution that came to mind was to rename my flag from `version` to something else (e.g. `ver`). While this might be a viable approach to fix the issue it was definitely not a desirable one. As such, I [reported the issue](https://github.com/vitessio/vitess/issues/10714) to the package provider to see if they'd be willing to make any compatibility adjustments on their end to accommodate my use case.

While initially it appeared that my only recourse would be to rename the flag, a clever user [responded](https://github.com/vitessio/vitess/issues/10714#issuecomment-1186579881) to my issue, making me aware of the `flag.NewFlagSet` function. By calling the `NewFlagSet` function in my code before defining my flags I was able to prevent conflicts with the newly imported package.

```go
package main

import (
	"flag"
	"fmt"
)

var version string

func main() {
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	ver := flag.Bool("version", false, "Get current version")
	flag.Parse()

	if *ver {
		fmt.Println(ver)
	}
}
```