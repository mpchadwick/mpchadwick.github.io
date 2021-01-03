---
layout: blog-single
title:  "Testing Log Output in Go with logrus"
date: November 15, 2020
image: 
tags: [Go, Golang]
---

[logrus](https://github.com/sirupsen/logrus) provides a nice facility for testing logging, which is [documented in the README](https://github.com/sirupsen/logrus#testing). While the README gives you a general idea of the offering, it doesn't provide any opinions on how to structure your project to support log testing, leaving you on your own to decide on a strategy. Here I wanted to show you the strategy I came up with and am currently using on my project [`dbanon`](https://github.com/mpchadwick/dbanon).

<!-- excerpt_separator -->

### Creating `logger.go`

After some consideration, the best solution I came up with was to implement a file `logger.go`. It looks like this:

```go
import (
	"github.com/sirupsen/logrus"
)

var logger *logrus.Logger

func init() {
	logger = logrus.New()
}

// GetLogger returns the logger instance.
// This instance is the entry point for all logging
func GetLogger() *logrus.Logger {
	return logger
}

// SetLogger sets the logger instance
// This is useful in testing as the logger can be overridden
// with a test logger
func SetLogger(l *logrus.Logger) {
	logger = l
}
```

**Example**: [https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/logger.go](https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/logger.go)

You'll see the reasoning for this file in the coming examples. 

### Using `logger.go` in application

In the application the idea is to do any logging through the `*logrus.Logger` instance the `GetLogger` function defined `logger.go` returns.

```go
logger := GetLogger()
if !someCheck() {
	logger.Error("Something failed")
}
```

**Example**: [https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/provider.go#L111-L118](https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/provider.go#L111-L118
)

Any configuration should also be done against the `*logrus.Logger` instance returned by `GetLogger`

```go
logger := GetLogger()
logger.SetLevel(level)
```

**Example**: [https://github.com/mpchadwick/dbanon/blob/v0.6.0/main.go#L67-L86](https://github.com/mpchadwick/dbanon/blob/v0.6.0/main.go#L67-L86)

### Using `logger.go` in testing

In your tests, you use the `SetLogger()` function defined in `logger.go` to replace the actual logger with test logger.

```go
testLogger, hook := test.NewNullLogger()
SetLogger(testLogger)
```

**Example**: [https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/provider_test.go#L9-L10](https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/provider_test.go#L9-L10)

Now you can call methods with inputs that are expected to generate log messages and check the `hook`.

```go
_ := DoSomething("Bad input")
	if hook.LastEntry().Message != "That input was bad" {
		t.Errorf("Bad input handled incorrectly")
	}
```

**Example**: [https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/provider_test.go#L39-L42](https://github.com/mpchadwick/dbanon/blob/v0.6.0/src/provider_test.go#L39-L42)