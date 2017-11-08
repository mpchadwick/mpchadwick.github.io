---
layout: blog-single
title: "Using Kapacitor UDFs to monitor URL query parameter usage"
description: Query parameters such as gclid can negatively impact page cache hit rate. Learn how to monitor their usage with Kapacitor UDFs.
date: July 26, 2016
tags: [Monitoring, Scaling, InfluxDB, Kapacitor, Go]
selected: true
---

Page caching implementations such as Varnish store unique cache entries for each URL. This makes sense...in theory each URL *should* identify a unique resource. However, advertising platforms such as Google Adwords need to be able to track the behavior of users that enter your site through their ads. To do this, they add *their own* unique identifier to the URL (e.g. "gclid", "gdftrk"). If nothing is done about this, traffic entering your site through these platforms will never hit the cache (on the first page load). What would happen if your site experienced a surge of traffic using these unique identifiers? Can your infrastructure handle a sudden burst of requests for uncached pages?

<!-- excerpt_separator -->

(Good) page caching implementations offer strategies for dealing with this. [Varnish has published some guidelines on how to strip gclid here](https://www.varnish-cache.org/trac/wiki/VCLExampleStripGoogleAdwordsGclidParameter). The thing is, you need to know which parameters to strip ahead of time <sup style="display: inline-block" id="a1">[1](#f1)</sup>. But what happens if the marketing department launches a new "strategic partnership" that's going to drive a boatload of traffic with a new unique query identifier, all without telling the tech team?

In this post I'll show you how to monitor query parameter usage on your site using [Kapcitor UDFs](https://docs.influxdata.com/kapacitor/v0.13/nodes/u_d_f_node/).

> **NOTE** The UDF we'll be looking at is written in Go.

### Getting the raw data into InfluxDb

In order to monitor query parameter usage, we first need to get the URL for each request into InfluxDb. [Once you have InfluxDb installed](https://github.com/influxdata/telegraf/tree/986735234b68359812f4ab65fb26f6a926874e31/plugins/inputs/logparser) the best way to do this is with [the Telegraf logparser plugin](https://github.com/influxdata/telegraf/tree/986735234b68359812f4ab65fb26f6a926874e31/plugins/inputs/logparser).

> Note: At the time of writing this, the logparser plugin is not included in the latest stable v0.13 release of Telegraf. You'll need to follow [the instructions for downloading the nightly release](https://influxdata.com/downloads/#telegraf).

Telegraf is *really* easy to set up. Just follow [the instructions from the Telegraf docs](https://docs.influxdata.com/telegraf/v0.13/introduction/installation/). Once you've downloaded Telegraf you'll need to...

##### 1. Configure the InfluxDB Output plugin in your Telegraf configuration file

Super simple. Just provide the necessary details (URL, db, username, password, etc...) to connect to InfluxDb in the Telegraf configuration file. When you generate a fresh configuration file it will look like this...

```toml
[[outputs.influxdb]]
  ## The full HTTP or UDP endpoint URL for your InfluxDB instance.
  ## Multiple urls can be specified as part of the same cluster,
  ## this means that only ONE of the urls will be written to each interval.
  # urls = ["udp://localhost:8089"] # UDP endpoint example
  urls = ["http://localhost:8086"] # required
  ## The target database for metrics (telegraf will create it if not exists).
  database = "telegraf" # required

  ## Retention policy to write to. Empty string writes to the default rp.
  retention_policy = ""
  ## Write consistency (clusters only), can be: "any", "one", "quorom", "all"
  write_consistency = "any"

  ## Write timeout (for the InfluxDB client), formatted as a string.
  ## If not provided, will default to 5s. 0s means no timeout (not recommended).
  timeout = "5s"
  # username = "telegraf"
  # password = "metricsmetricsmetricsmetrics"
  ## Set the user agent for HTTP POSTs (can be useful for log differentiation)
  # user_agent = "telegraf"
  ## Set UDP payload size, defaults to InfluxDB UDP Client default (512 bytes)
  # udp_payload = 512

  ## Optional SSL Config
  # ssl_ca = "/etc/telegraf/ca.pem"
  # ssl_cert = "/etc/telegraf/cert.pem"
  # ssl_key = "/etc/telegraf/key.pem"
  ## Use SSL but skip chain & host verification
  # insecure_skip_verify = false
```

##### 2. Configure the logparser Input in your telegraf configuration file

Also a piece of cake. You need to tell logparser where your log files (e.g. Apache, Nginx) live and specify the pattern in use. logparser includes patterns for [common](https://github.com/influxdata/telegraf/blob/986735234b68359812f4ab65fb26f6a926874e31/plugins/inputs/logparser/grok/influx_patterns.go#L69) and [combined](https://github.com/influxdata/telegraf/blob/986735234b68359812f4ab65fb26f6a926874e31/plugins/inputs/logparser/grok/influx_patterns.go#L74) logs. Here's an example configuration file for capturing logs in common log format

```toml
[[inputs.logparser]]
#   ## Log files to parse.
#   ## These accept standard unix glob matching rules, but with the addition of
#   ## ** as a "super asterisk". ie:
#   ##   /var/log/**.log     -> recursively find all .log files in /var/log
#   ##   /var/log/*/*.log    -> find all .log files with a parent dir in /var/log
#   ##   /var/log/apache.log -> only tail the apache log file
    files = ["/var/log/httpd/access_log"]
#   ## Read file from beginning.
#   from_beginning = false
#
#   ## Parse logstash-style "grok" patterns:
#   ##   Telegraf built-in parsing patterns: https://goo.gl/dkay10
    [inputs.logparser.grok]
#     ## This is a list of patterns to check the given log file(s) for.
#     ## Note that adding patterns here increases processing time. The most
#     ## efficient configuration is to have one pattern per logparser.
#     ## Other common built-in patterns are:
#     ##   %{COMMON_LOG_FORMAT}   (plain apache & nginx access logs)
#     ##   %{COMBINED_LOG_FORMAT} (access logs + referrer & agent)
      patterns = ["%{COMMON_LOG_FORMAT}"]
#     ## Full path(s) to custom pattern files.
#     custom_pattern_files = []
#     ## Custom patterns can also be defined here. Put one pattern per line.
#     custom_patterns = '''
#     '''
```

### Setting up Kapacitor

Once we have Telegraf pushing metrics to InfluxDb. We're ready to use [Kapacitor](https://influxdata.com/time-series-platform/kapacitor/) to extract the query params from the URLs and store them back into InfluxDb.

Kapacitor is also [trivial to install](https://docs.influxdata.com/kapacitor/v0.13/introduction/installation/). We're going to be writing our UDF in Go, so in order to build the executable UDF you'll need to [install Go](https://golang.org/doc/install) as well.

### Some Background on Kapacitor UDFs

UDFs are one of the most power features of Kapacitor. [TICKScript](https://docs.influxdata.com/kapacitor/v0.13/tick/) has many great capabilities, but with UDFs you can pipe data from Kapacitor to a program you write in any language, process the data, and spit it back out (e.g. to store the processed result back into InfluxDb). InfluxData has provided [agents in in Go and Python](https://github.com/influxdata/kapacitor/tree/aa2803554b0d9c4e595983fc5248d8c58ca4fd98/udf/agent). They've also provided a lot of documentation and examples for of UDF usage. The following links are all worth your time to read...

- [An example of using UDFs for custom anomaly detection in Python](https://docs.influxdata.com/kapacitor/v0.13/examples/anomaly_detection/)
- [An example UDF that receives a stream of points and sends back the same stream without any processing (a "mirror") written in Go](https://docs.influxdata.com/kapacitor/v0.13/examples/socket_udf/)
- [3 example UDFs written in both Go and Python](https://github.com/influxdata/kapacitor/tree/0d9288643a618e37f27fd941af9d7949cfbe8c17/udf/agent/examples)
- [A video showing how to create UDFs in Python](https://vimeo.com/153160237)
- [General documentation for the UDF node](https://docs.influxdata.com/kapacitor/v0.13/nodes/u_d_f_node/)
- [A README about UDF agents and servers](https://github.com/influxdata/kapacitor/tree/master/udf/agent/)

I spent a lot of time reviewing those links, but it was still a bit tough to wrap my head around UDFs. In my case...

- The domains used in the examples above are not particularly relevant to the type of problems I deal with on a day-to-day basis.
- I don't write or read Go or Python reguarly.

Still, I knew they were powerful, so I stuck with it. The UDF we're about to look at is something I have running in production, which is providing a lot of value. Hopefully this example will help the concept of UDFs click for a few others as well...

### Making Kapacitor aware of your UDF

Before we look at how to write the UDF, I'd like to show you how to register your UDF with Kapacitor. The tutorials published by InfluxData show this step **after** the UDF is done, but think it may be helpful to first understand *how* to get Kapactor to pass data to your UDF.

Doing so is simple. Again, in the kapcitor configuration file...

```toml
[udf]
[udf.functions]
  [udf.functions.queryParser]
    prog = "/Users/maxchadwick/go/bin/query_parser"
    args = []
    timeout = "10s"
```

`@queryParser` is what we'll use to call the UDF in our TICKScript. `prog` specifies the path to the executable file.

### Passing data to your UDF in TICKScript

As mentioned above, we'll execute the UDF by calling `@queryParser` in our TICKScript. By default `logparser` will write to a measurement called `logparser_grok`. We want to stream the data from that measurement to our UDF and we will output it to a new measurement called `query_param`.

```
stream
    |from()
        .measurement('logparser_grok')
    @queryParser()
    |influxDBOut()
        .database('telegraf')
        .retentionPolicy('default')
        .measurement('query_param')

```

### UDF Starting Formula

> **NOTE**: I have published the UDF in question to Github [here](https://github.com/mpchadwick/kapacitor_utils/blob/858695f4c47e618c41d08f5b1e85510047d78801/query_parser/query_parser.go).

Everything is now in place to pass the data to our UDF, but there's a big problem...our UDF doesn't actually exist yet! Let's take a look at the basic starting formula for a UDF in Go.

```go
package main

import (
    "log"
    "os"

    "github.com/influxdata/kapacitor/udf"
    "github.com/influxdata/kapacitor/udf/agent"
)

type queryParserHandler struct {
    agent *agent.Agent
}

func newQueryParserHandler(a *agent.Agent) *queryParserHandler {
    return &queryParserHandler{agent: a}
}

func main() {
    a := agent.New(os.Stdin, os.Stdout)
    h := newQueryParserHandler(a)
    a.Handler = h

    log.Println("Starting agent")
    a.Start()
    err := a.Wait()
    if err != nil {
        log.Fatal(err)
    }
}
```

Starting with the `main` function, as you can see, we first create a new `agent`, which is available by importing `github.com/influxdata/kapacitor/udf/agent`. The agent will work with `stdin` and `stdout` (passed as arguments when creating the `agent`). Then we set its "handler"  - which is the thing we write that will ingest, process and output the data stream. Once the handler has been specified, we `Start` the agent and tell it to `Wait`.

This is the basic boilerplate structure for writing UDFs in Go. Check out [the `moving_avg` example starting with the `main` method](https://github.com/influxdata/kapacitor/blob/0d9288643a618e37f27fd941af9d7949cfbe8c17/udf/agent/examples/moving_avg/moving_avg.go#L165-L176).

### Implementing the `Handler`

The handler is where we will introduce our custom processing logic. InfluxDb provides a `Handler` interface which we must satisfy. It looks like this...

```go
type Handler interface {
    // Return the InfoResponse. Describing the properties of this Handler
    Info() (*udf.InfoResponse, error)
    // Initialize the Handler with the provided options.
    Init(*udf.InitRequest) (*udf.InitResponse, error)
    // Create a snapshot of the running state of the handler.
    Snaphost() (*udf.SnapshotResponse, error)
    // Restore a previous snapshot.
    Restore(*udf.RestoreRequest) (*udf.RestoreResponse, error)

    // A batch has begun.
    BeginBatch(*udf.BeginBatch) error
    // A point has arrived.
    Point(*udf.Point) error
    // The batch is complete.
    EndBatch(*udf.EndBatch) error

    // Gracefully stop the Handler.
    // No other methods will be called.
    Stop()
}
```

The comments on the methods do a good job of explaining what each method does. In our case, the `Point` method is of most interest. It's the method that will be called each time our UDF receives a `udf.Point` from the InfluxDb stream. I will show your our `Point` method, momentarily, but first let's take a quick look at the `udf.Point` struct to see how the `Point`'s data will be available when it arrives at our UDF.

```go
type Point struct {
    Time            int64              `protobuf:"varint,1,opt,name=time" json:"time,omitempty"`
    Name            string             `protobuf:"bytes,2,opt,name=name" json:"name,omitempty"`
    Database        string             `protobuf:"bytes,3,opt,name=database" json:"database,omitempty"`
    RetentionPolicy string             `protobuf:"bytes,4,opt,name=retentionPolicy" json:"retentionPolicy,omitempty"`
    Group           string             `protobuf:"bytes,5,opt,name=group" json:"group,omitempty"`
    Dimensions      []string           `protobuf:"bytes,6,rep,name=dimensions" json:"dimensions,omitempty"`
    Tags            map[string]string  `protobuf:"bytes,7,rep,name=tags" json:"tags,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
    FieldsDouble    map[string]float64 `protobuf:"bytes,8,rep,name=fieldsDouble" json:"fieldsDouble,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"fixed64,2,opt,name=value"`
    FieldsInt       map[string]int64   `protobuf:"bytes,9,rep,name=fieldsInt" json:"fieldsInt,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"varint,2,opt,name=value"`
    FieldsString    map[string]string  `protobuf:"bytes,10,rep,name=fieldsString" json:"fieldsString,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
}
```

Any UDF you write will certainly be interacting with `udf.Point`s.

Now, let's take a look at `queryParserHandler`'s `Point` method.

> **NOTE**: Our UDF also requires importing the `strings` library. I didn't show that in the "starting formula" because it isn't needed there and thus Go wouldn't compile the code.

```go
func (q *queryParserHandler) Point(p *udf.Point) error {
    value := p.FieldsString["request"]
    pos := strings.Index(value, "?")
    if pos == -1 {
        // No query string? See ya!
        return nil
    }

    query := value[pos+1 : len(value)]
    params := strings.Split(query, "&")

    for i := 0; i < len(params); i++ {
        parts := strings.Split(params[i], "=")
        value := ""
        if len(parts) == 2 {
            value = parts[1]
        }

        newPoint := new(udf.Point)
        newPoint.Time = p.Time
        newPoint.Tags = map[string]string{
            "k": parts[0],
        }
        newPoint.FieldsString = map[string]string{
            "v": value,
        }

        q.agent.Responses <- &udf.Response{
            Message: &udf.Response_Point{
                Point: newPoint,
            },
        }
    }

    return nil
}
```

OK, that's a lot to process. Let's go line-by-line...

```go
value := p.FieldsString["request"]
```

The Telegraf logparser plugin sends the URL for each entry as a `field`. We access is through the `FieldsString` property on the `point` and store it in a local variable.

```go
pos := strings.Index(value, "?")
```

Next we check if there's a `?` in the URL.

```go
if pos == -1 {
    // No query string? See ya!
    return nil
}
```

If there's no `?` we bail. There aren't any query parameters to extract.

```go
query := value[pos+1 : len(value)]
params := strings.Split(query, "&")
```

Otherwise, we isolate the query string from the URL and split it up into parts separated by the `&` symbol.

```go
for i := 0; i < len(params); i++ {
```

We iterate through all the query params.

```go
parts := strings.Split(params[i], "=")
```

Then, we extract the key and value from the query param by splitting on the equal sign.

```go
value := ""
if len(parts) == 2 {
    value = parts[1]
}
```

We initialize the value to an empty string, in case we got a query param without any value. If we did get a value in the query we use that.

```go
newPoint := new(udf.Point)
newPoint.Time = p.Time
newPoint.Tags = map[string]string{
    "k": parts[0],
}
newPoint.FieldsString = map[string]string{
    "v": value,
}
```

We then create a new `udf.Point` setting its time to the time of the original `Point` we received and setting the key in the query param as a tag and the value as a field.

```go
q.agent.Responses <- &udf.Response{
    Message: &udf.Response_Point{
        Point: newPoint,
    },
}
```

We then send a message to the `agent`'s `Responses` channel with our new point.

```go
return nil
```

Finally we return `nil`.

There are a few other methods we need to implement to satisfy the interface, but I don't want to dwell on those here. Our final UDF looks like this...

```go
/**
 * Takes in a stream from logparser and tracks usage of query parameters in the
 * URL
 *
 * query_param,key=key value=value
 */
package main

import (
    "errors"
    "log"
    "os"
    "strings"

    "github.com/influxdata/kapacitor/udf"
    "github.com/influxdata/kapacitor/udf/agent"
)

type queryParserHandler struct {
    agent *agent.Agent
}

func newQueryParserHandler(a *agent.Agent) *queryParserHandler {
    return &queryParserHandler{agent: a}
}

func (*queryParserHandler) Info() (*udf.InfoResponse, error) {
    info := &udf.InfoResponse{
        Wants:    udf.EdgeType_STREAM,
        Provides: udf.EdgeType_STREAM,
        Options:  map[string]*udf.OptionInfo{},
    }
    return info, nil
}

func (q *queryParserHandler) Init(r *udf.InitRequest) (*udf.InitResponse, error) {
    init := &udf.InitResponse{
        Success: true,
        Error:   "",
    }
    return init, nil
}

func (*queryParserHandler) Snaphost() (*udf.SnapshotResponse, error) {
    return &udf.SnapshotResponse{}, nil
}

func (*queryParserHandler) Restore(req *udf.RestoreRequest) (*udf.RestoreResponse, error) {
    return &udf.RestoreResponse{
        Success: true,
    }, nil
}

func (*queryParserHandler) BeginBatch(begin *udf.BeginBatch) error {
    return errors.New("batching not supported")
}

func (q *queryParserHandler) Point(p *udf.Point) error {
    value := p.FieldsString["request"]
    pos := strings.Index(value, "?")
    if pos == -1 {
        // No query string? See ya!
        return nil
    }

    query := value[pos+1 : len(value)]
    params := strings.Split(query, "&")

    for i := 0; i < len(params); i++ {
        parts := strings.Split(params[i], "=")
        value := ""
        if len(parts) == 2 {
            value = parts[1]
        }

        newPoint := new(udf.Point)
        newPoint.Time = p.Time
        newPoint.Tags = map[string]string{
            "k": parts[0],
        }
        newPoint.FieldsString = map[string]string{
            "v": value,
        }

        q.agent.Responses <- &udf.Response{
            Message: &udf.Response_Point{
                Point: newPoint,
            },
        }
    }

    return nil
}

func (*queryParserHandler) EndBatch(end *udf.EndBatch) error {
    return errors.New("batching not supported")
}

func (q *queryParserHandler) Stop() {
    close(q.agent.Responses)
}

func main() {
    a := agent.New(os.Stdin, os.Stdout)
    h := newQueryParserHandler(a)
    a.Handler = h

    log.Println("Starting agent")
    a.Start()
    err := a.Wait()
    if err != nil {
        log.Fatal(err)
    }
}
```

### What's Next?

There are a number of other topics I could discuss, now that we have our UDF to extracting query parameters from URL. However, this article is focused on writing Kapacitor UDFs. Just to get your gears spinning, once you have the query params data flowing back into InfluxDB you should be thinking about...

- [Downsampling via Continuous Queries](https://docs.influxdata.com/influxdb/v0.13/guides/downsampling_and_retention/#combining-rps-and-cqs-a-casestudy)
- [Visualizing the Data in Grafana](http://grafana.org/)
- [Alerting high usage of "unknown" query params](https://docs.influxdata.com/kapacitor/v0.13/nodes/alert_node/)

As always, if you have any questions or comments feel free to leave a comment below or [reach out to me on Twitter](https://twitter.com/maxpchadwick).

### Notes

<b id="f1">1</b>. It *might* be possible to take a whitelist approach in your page caching implementation to avoid this problem. This does seem risky though. If you build a new feature that relies on a new query parameter and forget to add it to your whitelist you're gonna have a bad time when you go to production... [↩](#a1)
