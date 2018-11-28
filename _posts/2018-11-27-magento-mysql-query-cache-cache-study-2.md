---
layout: blog-single
title:  "Magento + MySQL Query Cache: Case Study #2"
description: Details on a recent production issue caused by inefficient use of the MySQL query cache
date: November 27, 2018
image: /img/blog/magento-mysql-query-cache-2/new-relic-apm-overview@2x.jpg
tags: [Magento, MySQL]
---

Back in April of 2018 I published [a case study]({{ site.baseurl }}{% post_url 2018-04-01-magento-mysql-query-cache-case-study %}) demonstrating the (positive) impact the MySQL query cache generally has on application performance and scalability for Magento. A recent issue at work has further highlighted this. I posted a quick update about it on Twitter:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Biggest Black Friday / Cyber Monday issue so far caused by Amasty module preventing query cache from being used efficiently. I&#39;ve said it before but very opposed to query cache deprecation in MySQL 8.0</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/1067197024880205824?ref_src=twsrc%5Etfw">November 26, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Here I'll share full details on the incident...

<!-- excerpt_separator -->

### Setting the Stage

The alerts came in on the afternoon of Cyber Monday. Additionally, the client reported that the admin panel was more or less unusable and they were receiving payment transaction failed emails with the following reason...

> SQLSTATE[HY000]: General error: 1205 Lock wait timeout exceeded; try restarting transaction, query was: INSERT INTO sales_flat\_order

Looking in New Relic it was immediately apparent that MySQL performance had severely degraded...

<img
  class="rounded shadow"
  src="/img/blog/magento-mysql-query-cache-2/new-relic-apm-overview@1x.jpg"
  srcset="/img/blog/magento-mysql-query-cache-2/new-relic-apm-overview@1x.jpg 1x, /img/blog/magento-mysql-query-cache-2/new-relic-apm-overview@2x.jpg 2x"
  alt="Screenshot showing spike in MySQL response time">

Additionally, in the AWS console we could see the Aurora instance was at 100% CPU utilization...

<img
  class="rounded shadow"
  src="/img/blog/magento-mysql-query-cache-2/aws-cloudwatch-db-cpu@1x.jpg"
  srcset="/img/blog/magento-mysql-query-cache-2/aws-cloudwatch-db-cpu@1x.jpg 1x, /img/blog/magento-mysql-query-cache-2/aws-cloudwatch-db-cpu@2x.jpg 2x"
  alt="Screenshot showing spike in CPU utilization pinned at 100%">

### What Was MySQL Doing?

From the "Databases" tab we could see that the vast majority of the time was being spent on `SELECT` queries issued to the `salesrule` table.

<img
  class="rounded shadow"
  src="/img/blog/magento-mysql-query-cache-2/new-relic-database-activity@1x.jpg"
  srcset="/img/blog/magento-mysql-query-cache-2/new-relic-database-activity@1x.jpg 1x, /img/blog/magento-mysql-query-cache-2/new-relic-database-activity@2x.jpg 2x"
  alt="Screenshot showing database activity as reported by New Relic">

We knew that Magento out-of-box runs [a very inefficient SELECT query]({{ site.baseurl }}{% post_url 2017-04-18-scaling-magento-sales-rule-to-20-million-coupons-and-beyond %}) against that table and even have a patch for it, however, these queries weren't quite the same. They looked like this:

```sql
SELECT COUNT(*)
    FROM `salesrule` AS `main_table`
    INNER JOIN `salesrule_customer_group` AS `customer_group_ids`
        ON main_table.rule_id = customer_group_ids.rule_id
        AND customer_group_ids.customer_group_id = ?
    LEFT JOIN `salesrule_coupon` AS `c`
        ON main_table.rule_id = c.rule_id
WHERE (EXISTS (SELECT ? FROM `salesrule_website` AS `website` WHERE (website.website_id IN (?)) AND (main_table.rule_id = website.rule_id)))
    AND (from_date IS null OR from_date <= ?)
    AND (to_date IS null OR to_date >= ?)
    AND (`is_active` = ?)
    AND ( main_table.coupon_type = ? OR c.code IN(?))
    AND (
        (`amrule_use_time` = ? OR (? > `amrule_from_time` AND ? < `amrule_to_time`))
        AND (`amrule_use_weekdays` = ? OR (`amrule_days_of_week` LIKE ?))
    )
    AND (`sort_order` < ?)
GROUP BY `main_table`.`rule_id`
```

### What Was Different?

It turned out that the `SELECT` query was being customized by the `Amasty_RuleTimeConditions` module. It was adding the additional `WHERE` conditions

```php
$timestamp = Mage::getModel('core/date')->timestamp();
$currentTime = date('H:i:s', $timestamp);
$currentDay = date('w', $timestamp);
$this->getSelect()->where("
(`amrule_use_time` = 0
    OR ('$currentTime' > `amrule_from_time` and ' $currentTime ' < `amrule_to_time`))
AND (`amrule_use_weekdays` = 0
    OR (`amrule_days_of_week` LIKE '%$currentDay%'))");
```

### What Could We Do?

Adding compatibility with `Amasty_RuleTimeConditions` to our patch for the Magento `SELECT` and testing and deploying in the midst of a Black Friday emergency didn't seem like the best course of action. As we looked more closely at the Amasty customization we noticed the following...

```php
$currentTime = date('H:i:s', $timestamp);
```

Because it was adding the current date **including seconds** the `SELECT`s would only be valid in the query cache for 1 second. Basically what this code was doing was allowing more fine grained control of the promo start and end time, down to the second level. However, our client didn't have their promo configured to to start and end with second level precision (I double anyone does, for that matter). As such we could *strip* the seconds from the query. This would make it 60X more likely that the query would hit the query cache.

```diff
$ git diff app/code/local/Amasty/RuleTimeConditions/Model/Resource/Rule/Collection.php
diff --git a/app/code/local/Amasty/RuleTimeConditions/Model/Resource/Rule/Collection.php b/app/code/local/Amasty/RuleTimeConditions/Model/Resource/Rule/Collection.php
index 43af14bf7..c39c0596b 100644
--- a/app/code/local/Amasty/RuleTimeConditions/Model/Resource/Rule/Collection.php
+++ b/app/code/local/Amasty/RuleTimeConditions/Model/Resource/Rule/Collection.php
@@ -21,7 +21,7 @@ class Amasty_RuleTimeConditions_Model_Resource_Rule_Collection extends Amasty_Ru
             parent::setValidationFilter($websiteId, $customerGroupId, $couponCode, $now);
             $timestamp = Mage::getModel('core/date')->timestamp();
-            $currentTime = date('H:i:s', $timestamp);
+            $currentTime = date('H:i', $timestamp);
             $currentDay = date('w', $timestamp);
             $this->getSelect()->where("
```

### The Result

Upon implementation of our fix we immediately saw a massive improvement in MySQL performance.

<img
  class="rounded shadow"
  src="/img/blog/magento-mysql-query-cache-2/new-relic-apm-overview-after-fix@1x.jpg"
  srcset="/img/blog/magento-mysql-query-cache-2/new-relic-apm-overview-after-fix@1x.jpg 1x, /img/blog/magento-mysql-query-cache-2/new-relic-apm-overview-after-fix@2x.jpg 2x"
  alt="Screenshot showing New Relic APM overview after implementing fix">

Mission accomplished :boom: