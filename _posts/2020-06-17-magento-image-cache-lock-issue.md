---
layout: blog-single
title: "Magento Image Cache Lock Contention Issue"
date: June 17, 2020
image: /img/blog/magento-image-cache-lock-contention/new-relic-most-transaction-trace@2x.png
tags: [Magento]
---

During a recent Magento v2.3.5 upgrade (which was ultimately rolled back), we saw severely degraded performance when rolling back the the previous version. In New Relic we could see the most time consuming transaction was `/unknown`.

<img
  class="rounded shadow"
  src="/img/blog/magento-image-cache-lock-contention/new-relic-most-time-consuming@1x.png"
  srcset="/img/blog/magento-image-cache-lock-contention/new-relic-most-time-consuming@1x.png 1x, /img/blog/magento-image-cache-lock-contention/new-relic-most-time-consuming@2x.png 2x"
  alt="Screenshot most time consuming transactions in New Relic">

Reviewing the transaction traces we could see that these were requests to generate resized images, and that almost all of the time was being spent on the `Magento\Framework\Filesystem\Driver\File::fileLock` function.

<img
  class="rounded shadow"
  src="/img/blog/magento-image-cache-lock-contention/new-relic-transaction-trace@1x.png"
  srcset="/img/blog/magento-image-cache-lock-contention/new-relic-transaction-trace@1x.png 1x, /img/blog/magento-image-cache-lock-contention/new-relic-transaction-trace@2x.png 2x"
  alt="Screenshot of transaction trace in New Relic">

<!-- excerpt_separator -->

It turns out that each request to generate a cached image (via `get.php`), attempts to acquire an exclusive lock on the `var/resource_config.json` file.

```php
// Magento\MediaStorage\Model\File\Storage\Config::save
$file = $this->rootDirectory->openFile($this->rootDirectory->getRelativePath($this->cacheFilePath), 'w');
try {
    $file->lock();
    $file->write(json_encode($this->config));
    $file->unlock();
    $file->close();
} catch (FileSystemException $e) {
    $file->close();
}
```

This can lead to _major_ lock contention issues if, for one reason or another, Magento needs to generate a large number of resized images (e.g. image cache deleted, hash generation logic change). Magento support was able to provide us with patch [MDVA-26024](https://gist.github.com/mpchadwick/a0a18775e99a3f112f257b53db7a6075) for this issue. The issue also looks to be [resolved in the current 2.4-develop branch](https://github.com/magento/magento2/commit/a7001ce3a4612d9090d07dd705bff098def2d66c#diff-08533b0d5e521617de3b6395eb040a0d)


