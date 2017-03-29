---
layout: blog-single
title: Creating Grafana Annotations with InfluxDb
description: When reviewing historical data in tools such, it's typically useful to overlay a timeline of key events.  In this post we'll look at creating annotations for your InfluxDb powered Grafana visualizations.
date: August 08, 2016
tags: [monitoring, grafana, influxdb]
---

When reviewing historical data in tools such as InfluxDb, it's typically useful to overlay a timeline of key events. For example, [Google Analytics features a simple GUI for adding annotations](https://analytics.googleblog.com/2010/01/annotations-now-available-in-all.html) and [New Relic offers an API for marking deployments](https://docs.newrelic.com/docs/apm/new-relic-apm/maintenance/recording-deployments). In this post we'll look at creating annotations for your InfluxDb powered Grafana visualizations.

<!-- excerpt_separator -->

### Composition of an annotation

As shown in [the official Grafana documentation for annotations with InfluxDb](http://docs.grafana.org/reference/annotations/#influxdb-annotations), an annotation is composed of up to 3 pieces of data...

1. Title
2. Tags
3. Text

Grafana hasn't provided any official recommendation on how to use these three fields (that I can find), but in the screenshot below...

1. "Deployed v10.2.0" is the "Title"
2. "Release notes" is the "Text"
3. "these" "are" "the" "tags" are the "Tags"

<img
  src="/img/blog/grafana-annotations/grafana-influxdb-annotation-screenshot@1x.jpg"
  srcset="/img/blog/grafana-annotations/grafana-influxdb-annotation-screenshot@1x.jpg 1x, /img/blog/grafana-annotations/grafana-influxdb-annotation-screenshot@2x.jpg 2x"
  alt="Grafana InfluxDb Annotation Screenshot">

From my research it seems that...

1. The title is typically used to provide a heading for the event
2. The text provides additional information. Linking to release notes is good use case
3. I'm not sure what the intention of tagging events out be. Perhaps to allow filtering of annotations on a dashboard for certain tags, although I haven't seen that documented anywhere.

### Writing to data to InfluxDb

Grafana expects that each of the pieces of data will come from a [field](https://docs.influxdata.com/influxdb/v0.13//concepts/glossary/#field) not a [tag](https://docs.influxdata.com/influxdb/v0.13/concepts/glossary/#tag).

The InfluxDb query to create the annotation from the screenshot above looks like this.

```
curl -X POST "http://localhost:8086/write?db=mydb&precision=s" --data-binary 'events title="Deployed v10.2.0",text="<a href='https://github.com'>Release notes</a>",tags="these,are,the,tags" 1470661200'
```

As you can see...

- Grafana will let you send HTML in the "Text" such as a link to the release notes
- The tags are separated by spaces

### Pulling the data into Grafana

The annotation can be pulled into Grafana as follows...

<img
  src="/img/blog/grafana-annotations/grafana-influxdb-add-annotation@1x.jpg"
  srcset="/img/blog/grafana-annotations/grafana-influxdb-add-annotation@1x.jpg 1x, /img/blog/grafana-annotations/grafana-influxdb-add-annotation@2x.jpg 2x"
  alt="Grafana InfluxDb Add Annotation">

Per the Grafana docs, if you only select one field you don't need to fill out the Column mappings and that field will automatically be pulled in as the title

### Limitations

Annotations are created on a per dashboard basis....

- They can't apply to a single graph
- They can't apply to a single panel
- They can't apply across multiple dashboards

### Conclusion

When I was first reading on annotations I found that a lot of information was missing from [the Grafana annotation docs](http://docs.grafana.org/reference/annotations/), so I'm hoping this will help a few people. Feel free to use the comments section below or [hit me up on Twitter](https://twitter.com/maxpchadwick) if you have comments or questions.
