---
layout: blog-single
title:  "Getting the Current Fastly VCL via API"
date: September 28, 2022
image: 
tags: [Tools]
related_posts:
---

This is just a quick little tip, but something I always have to look up how to do. The Fastly API has [an endpoint for fetching the generated VCL for a service](https://developer.fastly.com/reference/api/vcl-services/vcl/#get-custom-vcl-generated). The issue is that the `version_id` for the serivce must be provided in the request (there's no way to say "just give me the currently active VCL").

<!-- excerpt_separator -->

As such, we need to first use the [List versions of a service](https://developer.fastly.com/reference/api/services/version/#list-service-versions) endpoint to identify the active version. From there we can request the generated VCL.

Putting this all together, assuming you have [`jq`](https://stedolan.github.io/jq/) installed, here's how to do this in practice (replace `FASTLY_KEY` and `SERVICE_ID` with the correct values for your project).

<div class="tout tout--secondary">
<p>For Magento Cloud environments, the Fastly Key and Service ID can be found in the `/mnt/shared/fastly_tokens.txt` file. "API Token" is the `FASTLY_KEY` and "Serivce ID" is the `SERVICE_ID`.</p>
</div>

```
# Get the active version. In this example 105 is active
$ curl --silent -H "Fastly-Key: FASTLY_KEY" https://api.fastly.com/service/SERVICE_ID/version \
  | jq '.[] | if .active then .number else empty end'
105

# Get the VCL
$ curl -H "Fastly-Key: FASTLY_KEY" https://api.fastly.com/service/SERVICE_ID/version/105/generated_vcl
{"version":105,"service_id":"...
```
