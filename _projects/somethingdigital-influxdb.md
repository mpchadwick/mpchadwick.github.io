---
title: SomethingDigital_InfluxDb
position: 200
languages: PHP
tags: Magento, Monitoring
view_url: https://github.com/sdinteractive/SomethingDigital_InfluxDb
call_to_action: View on GitHub
---

I built a Magento 1 plugin at Something Digital that pushes metrics from Magento to InfluxDb for tracking in time series. There are many metrics that it can be configured to push. Here are a few...

- Cron execution history
- Changelog table status
- Full page cache size

Additionally, it includes a `Measurement` interface which user's can implement to add push their own metrics to InfluxDb.
