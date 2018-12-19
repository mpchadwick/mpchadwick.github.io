---
layout: blog-single
title:  "Proxying Guzzle Requests Through Tor"
description: A quick trick to proxy Guzzle requests through Tor
date: December 16, 2018
image:
tags: [PHP, Security]
---

[Guzzle](https://github.com/guzzle/guzzle) is the de facto library for doing HTTP requests in PHP. There may be cases where you'd prefer not to disclose your IP address when using it. You may also be using [3rd party tools](https://github.com/steverobbins/magescan) and not be in a great position to introduce the proxying at an application level.

Fortunately, all you need to do is set the `ALL_PROXY` environment variable when running your code.

<!-- excerpt_separator -->

Here's an example...

#### Script

```php
// guzzle-test.php 
<?php

require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();
$res = $client->request('GET', $argv[1]);

echo $res->getBody() . PHP_EOL;
```

#### Execution

```
$ ALL_PROXY=socks5://localhost:9050 php guzzle-test.php icanhazip.com
185.220.101.44
```

Happy hacking!


