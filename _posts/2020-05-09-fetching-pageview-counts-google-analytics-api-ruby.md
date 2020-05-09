---
layout: blog-single
title: "Fetching Pageview Counts from Google Analytics API with Ruby"
date: May 9, 2020
image: 
tags: [Ruby, Google Analytics]
related_posts:
- "Checking If An Array Is Empty In Ruby"
- "Tracking Your Most Popular Blog Post Tags in Google Analytics with Jekyll"
---

I'm working on a [Jekyll plugin](https://jekyllrb.com/docs/plugins/) which needs to fetch page view counts from the Google Analytics API for popularity ranking. While Google's [google-api-ruby-client](https://github.com/googleapis/google-api-ruby-client) does support the [Reporting API v4](https://developers.google.com/analytics/devguides/reporting/core/v4) unfortunately there are no official examples from Google on how to use it.

As such I wanted to share a working example for fetching pageview counts from the Reporting API v4 in Ruby.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p>I'd like to give a big shoutout to the author of the post <a href="https://blog.pixielabs.io/google-analytics-reporting-api-in-ruby-cd44f07f6079">Google Analytics Reporting API in Ruby on Rails</a> which was hugely helpful in guiding me in the right direction.</p>
</div>

### The Code

The following code is currently working and allowing me to fetch pageview data from the Google Analytics API.

```ruby
require 'google/apis/analyticsreporting_v4'
require 'date'

service = Google::Apis::AnalyticsreportingV4::AnalyticsReportingService.new

# Without environment variables
# credentials = Google::Auth::ServiceAccountCredentials.make_creds(
#   json_key_io: File.open('service_account_json_key.json'),
#   scope: 'https://www.googleapis.com/auth/analytics.readonly'
# )

# With environment variables
credentials = Google::Auth::ServiceAccountCredentials.make_creds(
  scope: 'https://www.googleapis.com/auth/analytics.readonly'
)

service.authorization = credentials

$google_client = service

date_range = Google::Apis::AnalyticsreportingV4::DateRange.new(
  start_date: Date.today - 90,
  end_date: Date.today
)

metric = Google::Apis::AnalyticsreportingV4::Metric.new(
  expression: "ga:pageviews"
)

dimension = Google::Apis::AnalyticsreportingV4::Dimension.new(
  name: "ga:pagePath"
)

report_request = Google::Apis::AnalyticsreportingV4::ReportRequest.new(
  view_id: '<<YOUR-VIEW-ID>>',
  sampling_level: 'DEFAULT',
  date_ranges: [date_range],
  metrics: [metric],
  dimensions: [dimension]
)

request = Google::Apis::AnalyticsreportingV4::GetReportsRequest.new(
  { report_requests: [report_request] }
)
# Make API call.
response = $google_client.batch_get_reports(request)

response.reports.first.data.rows.each do |row|
  puts row.dimensions[0]
  puts row.metrics[0].values[0]
end
```

Executing this at the command line prints the page path, followed by number of page views for each page:

```
$ ruby fetch-ga-pageviews.rb
/
452
/?ref=hexometer
7
/?semalt.com/10=
1
/blog/
186
/blog/5-enterprise-page-cache-missing-features
3
...
```

A couple things I'd like to call out...

### Authentication

The example uses environment variables for authentication [as documented in the README google-auth-library-ruby](https://github.com/googleapis/google-auth-library-ruby/blob/9bcac01574d539e281326beaa25d19e07002b525/README.md#example-environment-variables). I've included commented out code that shows how you can do it by pointing to the key file.

### view_id

You'll need to update the view_id with the correct value from your Google Analytics account. See [this guide](https://keyword-hero.com/documentation/finding-your-view-id-in-google-analytics). This is **not** your `UA-` value.

### Date Range

The example uses [Ruby Date](https://ruby-doc.org/stdlib-2.7.1/libdoc/date/rdoc/Date.html) to fetch the last 90 days of page views. This can be tweaked as needed.

### Query Strings

In the Google Analytics admin UI, query strings are stripped from URLs, but when using the `ga:pagePath` dimension, each query string variation is a unique `pagePath`:

```
/blog/ssrf-exploits-against-redis?fbclid=IwAR07g7Y7oP64H7NSvNl5s_9vIK8Gr34ErXDVF23QLPkOTbLjEZ3hriwG1yI
1
/blog/ssrf-exploits-against-redis?fbclid=IwAR09tXxWetvl_-biJF-l6kfdJPMjibUhHzoEv2HZhWDGzVEEvfWP1Mp2PrA
1
/blog/ssrf-exploits-against-redis?fbclid=IwAR0en_C-ebYeWfqLPFzbeGlaZ2lnf6aewRrLOBSAKU78rSF4HaS23PVkiuc
1
/blog/ssrf-exploits-against-redis?fbclid=IwAR0KA3oIkm_mPG3Z6RzKCaAnFJgH1MemsblGGuU2Lug7C18u6QBBbfIb8Qg
2
```

There's [some discussion about this](https://groups.google.com/forum/#!topic/google-analytics-data-export-api/0CFjo6sQPzo) the Gooogle Analytics API Google Group. It appears it's not possible to prevent this behavior when querying the API and you must make a change to your Google Analytics account. Personally, I plan to strip these out, **after** I get the response from the Google Analytics API.

