---
layout: blog-single
title:  "Analyzing Web Vitals Stored in Google Analytics"
date: November 8, 2020
image: 
tags: [Performance, Google Analytics, Python]
related_posts:
- "Tracking Paint Timing Metrics in Google Analytics"
- "Fetching Pageview Counts from Google Analytics API with Ruby"
- "Google Analytics Events & Bounce Rate"
---

Google Analytics is a convenient (free) place to store Web Vitals "field measurements". The Google Chrome team has provided [extensive instructions on how to do this](https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics).

When it comes to analyzing the data, the instructions are a bit more vague. If you spend some time trying to dig into the data, one thing will quickly become clear...the Google Analytics UI is **not** a good tool for this.

Here I'll cover my approach, which involves extracting the data via the Google Analytics Reporting API and analyzing it with [pandas](https://pandas.pydata.org/).

<!-- excerpt_separator -->

### Extracting the data

<div class="tout tout--secondary">
<p><strong>NOTE</strong>:  This blog posts assumes have already created a Google API service account and it has been granted appropriate access for the Google Analytics Reporting API v4</p>
</div>


Initially I began (and completed) writing my own script to do this in PHP. While it's fairly simple to do this, there are also some CLI tools available. The most popular tool you'll find is [Google Analytics for Python](https://github.com/debrouwere/google-analytics), which also features a CLI. However it hasn't been updated in a while and isn't using Google Analytics v4. [`gagocli`](https://github.com/MarkEdmondson1234/gago) is a decent alternative that uses v4 of the API and also has a CLI. Here's an example command to fetch Web Vitals using `gagocli`...

```
gagocli reports \
  -a ~/service-account-credentials.json \
  -start 2020-11-07 \
  -end 2020-11-07 \
  -view <<REDACTED>> \
  -mets ga:avgEventValue \
  -dims ga:date,ga:eventAction,ga:eventLabel,ga:deviceCategory \
  -max -1 | \
  grep -E '(ga:|CLS|FID|LCP|FCP)' > web-vitals.csv
```

The `grep` at the end is to filter out events other than Web Vitals or the header rows. A dimension filter would be a better way to do this, but [`gago` doesn't currently support them](https://github.com/MarkEdmondson1234/gago/issues/6).

Here's a snippet of the output of this command.

```
ga:eventAction,ga:eventLabel,ga:deviceCategory,ga:avgEventValue
CLS,1603565564853-2797512854296,desktop,322.0
CLS,1603823911817-3767336210138,desktop,0.0
CLS,1604157490353-2181475990414,desktop,0.0
CLS,1604244666344-8342106718758,desktop,0.0
CLS,1604244741729-1832161271177,desktop,0.0
CLS,1604255076403-6728536556600,desktop,0.0
CLS,1604258490934-2627169605613,desktop,121.0
CLS,1604364536338-3079300975286,desktop,0.0
```

As you can see since we used `ga:deviceCategory` as a dimension, we can analyze by device type. A full list of dimensions are available [here](https://ga-dev-tools.appspot.com/dimensions-metrics-explorer/). Another recommendation is to set up Content Grouping. This will allow you to analyze specific page types via the `ga:contentGroupXX` dimension.

### Analyzing the data

Initially I had wanted to use Excel Pivot Tables for this, however I quickly learned that Excel doesn't support percentile values in Pivot Tables. I tried a few other spreadsheet tools without any luck...

- **Google Sheets:** Supports median (which Excel doesn't) but no way to get 75th percentile (which is recommended benchmark by Google)
- **Apple Numbers:** Had never used it, but couldn't even get it to load all the data (I guess it only supports ~6K rows)
- **OpenOffice Calc:** Don't even ask...

While I could obviously write a script to parse the data and extract the percentiles it seemed like not the best solution. I wanted something flexible and I didn't want to have to re-invent the wheel.

I had recently been playing around with `pandas` while watching some machine learning videos and decided to give it a try. It turned out to be the perfect tool for the job (specifically `pandas.DataFrame.pivot_table`). Here's a quick script to get the median and 75th percentile for each Web Vitals metric...

```python
import pandas as pd
import numpy as np

def my75(g):
    return np.percentile(g, 75)

df = pd.read_csv("web-vitals.csv")
table = pd.pivot_table(
    df, 
    values='ga:avgEventValue',
    index=['ga:eventAction'],
    aggfunc=[np.median, my75]
)

print (table)
```

The output will look something like this:

```
                         median             my75
               ga:avgEventValue ga:avgEventValue
ga:eventAction
CLS                        74.0            261.0
FCP                      1331.0           2243.0
FID                         8.0             19.0
LCP                      1754.0           2861.0
```

Additional columns can be added to `index` (or via `columns`) to further segment the data.

For example, asssuming we have set up page type as content group 1 we can segment as follows:


```python
table = pd.pivot_table(
    df,
    values='ga:avgEventValue',
    index=['ga:eventAction', 'ga:contentGroup1'],
    aggfunc=[np.median, my75]
)
```

Here's a snippet of the output:

```
                                          median             my75
                                ga:avgEventValue ga:avgEventValue
ga:eventAction ga:contentGroup1
CLS            category                     56.0            96.00
               home                         99.0           133.00
               product                     394.0           629.00
FCP            category                    461.0          1614.50
               home                        971.0          2138.00
               product                    1995.0          2533.00
```

### Visualization

Pandas also allows us to create visualizations. Here we view 75th percentile CLS over time (plotting both the median and 75th percentile and a separate line for each page type is way too noisy).

```python
import matplotlib.pyplot as pp

df_cls = df.query('`ga:eventAction` == "CLS"')

table_cls = pd.pivot_table(
    df_cls,
    values='ga:avgEventValue',
    index=['ga:date'],
    columns=['ga:contentGroup1'],
    aggfunc=[my75]
)

plot_cls = table_cls.plot()

# Avoid scientific notation / offset for date
plot_cls.ticklabel_format(useOffset=False, style='plain', axis='both')

# Put the legend outside the plot
box = plot_cls.get_position()
plot_cls.set_position([box.x0, box.y0 + box.height * 0.1,
                 box.width, box.height * 0.9])
plot_cls.legend(loc='upper center', bbox_to_anchor=(0.5, -0.05),
          fancybox=True, shadow=True, ncol=5)

pp.show()
```