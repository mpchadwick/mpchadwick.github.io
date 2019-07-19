---
layout: blog-single
title:  "Testing Authorize.NET Credentials with cURL"
date: July 18, 2019
image: 
tags: [Tools]
---

Recently, a client supplied me with Authorize.NET to configure a custom application. When I plugged them in I received the following error:

```
E00007: User authentication failed due to invalid authentication values.
```
{:.wrap}

I needed to get back to them that the credentials weren't working, but wanted to provide evidence that the error wasn't due to a coding error in the custom application.

<!-- excerpt_separator -->

Some quick research brought me to the [`authenticateTestRequest `](https://developer.authorize.net/api/reference/index.html#gettingstarted-section-section-header) function.

Credentials can be tested with cURL using this function as follows:

```
curl https://api.authorize.net/xml/v1/request.api -d '
{
  "authenticateTestRequest": {
    "merchantAuthentication": {
      "name": "API-LOGIN-ID",
      "transactionKey": "TRANSACTION-KEY"  
    }
  }
}
'
```

Update API-LOGIN-ID and TRANSACTION-KEY as needed.

For sandbox testing switch the URL to https://apitest.authorize.net/xml/v1/request.api.

