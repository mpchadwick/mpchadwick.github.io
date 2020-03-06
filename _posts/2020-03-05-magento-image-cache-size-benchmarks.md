---
layout: blog-single
title: Magento Image Cache Storage Requirements
date: March 5, 2020
image:
tags: [Magento]
---

Recently I've been working with a client whose server is running low on disk space. I found that their `media/catalog/product` folder was 174 GB, 128 GB of which was in `media/catalog/product/cache`. This seemed like a lot to me, so I did some quick math and realized that the size of their image cache was nearly 3X that of the total size of the source images. This made me curious...what does this ratio look on other Magento installations? I decided to do a little research on this and wanted to share my findings.

<!-- excerpt_separator -->

### The Data

The table below contains my findings:

| Site | Total media/catalog/product | Total media/catalog/product/cache | Cache vs Source Percentage |
|:---|:---|:---|:---|
| 1 | 23 GB | 4.7 GB | 25.68% |
| 2 | 250 GB | 113 GB |  82.48% |
| 3 | 7.5 GB | 4.9 GB | 188.46% |
| 4 | 2.1 GB | 1.5 GB | 250.00% |
| 5 | 174 GB | 128 GB | 278.26% |
| 6 | 57 GB | 47 GB | 470.00% |
| 7 | 2.2 GB | 2.1 GB | 2100.00% | 


Per the table, the median image cache was 2.5X the size of the source images, meaning that the client in question was not unusual at all.

In the course of this research I also came across [this](https://github.com/magento/magento2/commit/41b1cd54488dd6709124d618f1c570e9d0eab51a) git commit. It looks like in Magento 2.4 it will be possible to offload image resizing to a 3rd party such as [Fastly](https://docs.fastly.com/en/guides/serving-images).