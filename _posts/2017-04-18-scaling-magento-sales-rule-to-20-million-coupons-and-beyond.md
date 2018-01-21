---
layout: blog-single
title: Scaling Magento's SalesRule Module to Handle 20 Million Coupons and Beyond
description: A look at how we cut 99% of the time required to resolve the discount for a given coupon code in a database with 20 million coupon codes.
date: April 18, 2017
image: 
tags: [Magento, Scaling, Performance]
ad: domain-clamp-ad-b.html
selected: true
---

In a recent New Relic performance audit on a client's site, we found that the `Mage_SalesRule` totals collectors were causing some serious slowness. At best, totals collection would execute in around 1.2s when coupons were at play. However, in the worst cases, **it would take up to 30 seconds**. 

<img
  class="rounded shadow"
  src="/img/blog/scaling-magento-salesrule/newrelic-trace-b@1x.jpg"
  srcset="/img/blog/scaling-magento-salesrule/newrelic-trace-b@1x.jpg 1x, /img/blog/scaling-magento-salesrule/newrelic-trace-b@2x.jpg 2x"
  alt="A screenshot showing New Relic's production traces">


Checking the database I found that the `salesrule_coupon` table had over 20 million records in it. In this post I'll show you how we were able to cut that down to literally milliseconds and keep totals collection performant, even with 20 million coupons in the database.

<!-- excerpt_separator -->

### The Query

From New Relic, we were able to see that the following query was slow...

```sql
SELECT `main_table`.*, `rule_coupons`.`code`
FROM `salesrule` AS `main_table`
  INNER JOIN `salesrule_customer_group` AS `customer_group_ids`
    ON main_table.rule_id = customer_group_ids.rule_id
    AND customer_group_ids.customer_group_id = ?
  LEFT JOIN `salesrule_coupon` AS `rule_coupons`
    ON main_table.rule_id = rule_coupons.rule_id
    AND main_table.coupon_type != ?
WHERE (EXISTS (SELECT ? FROM `salesrule_website` AS `website` WHERE (website.website_id IN (?)) AND (main_table.rule_id = website.rule_id)))
  AND (from_date IS null OR from_date <= ?)
  AND (to_date IS null OR to_date >= ?)
  AND (`is_active` = ?)
  AND (main_table.coupon_type = ? OR ((
    (main_table.coupon_type = ? AND rule_coupons.type = ?)
      OR (main_table.coupon_type = ? AND main_table.use_auto_generation = ? AND rule_coupons.type = ?)
      OR (main_table.coupon_type = ? AND main_table.use_auto_generation = ? AND rule_coupons.type = ?)
    ) AND rule_coupons.code = ?))
  AND (`main_table`.`coupon_type` IN(?, ?))
ORDER BY sort_order ASC
```

Tracing it back through the code we found that this query is largely a result of the code in the `setValidationFilter` method of `Mage_SalesRule_Model_Resource_Rule_Collection`.

Essentially, this query will fetch a list of sales rule candidates for the current quote, which will later be processed to determine the best fit, if there is one.

### The Issue

The issue with this query is here...

```sql
WHERE main_table.coupon_type = ? OR ((
  (main_table.coupon_type = ? AND rule_coupons.type = ?)
    OR (main_table.coupon_type = ? AND main_table.use_auto_generation = ? AND rule_coupons.type = ?)
    OR (main_table.coupon_type = ? AND main_table.use_auto_generation = ? AND rule_coupons.type = ?)
) AND rule_coupons.code = ?)
```

Essentially, MySQL cannot leverage the indexes due to the `WHERE OR`. [I blogged about a similar issue with scaling `catalogsearch_query`]({{ site.baseurl }}{% link _posts/2016-04-07-Scaling-Throughput-To-Magentos-Search-Results-Page.md %}). This causes it to do a full table scan of the `salesrule_coupon` table, which, as mentioned, had 20 million rows.

### The Solution

Per my blog post on catalog search, a more efficient way to achieve the desired goal is via a `UNION`. Essentially, the idea is to prepare two `SELECT` statements, one for both conditions on either side of the `OR` and `UNION` them together. This allows MySQL to efficiently use indexes for each of the `SELECT`s.

### The Implementation

In order to do this in Magento, the best option is to rewrite the `setValidationFilter` method in the `Mage_SalesRule_Model_Resource_Rule_Collection` class. Here is the full rewritten class.

```php
<?php

class SomethingDigital_SalesRulePerf_Model_Resource_Rule_Collection
    extends Mage_SalesRule_Model_Resource_Rule_Collection
{

    /**
     * Filter collection by specified website, customer group, coupon code, date.
     * Filter collection to use only active rules.
     * Involved sorting by sort_order column.
     *
     * Overwrite the parent for better performance.
     *
     * We UNION where noCoupon and yesCoupon SELECTs rather than use an OR
     *
     * @param int $websiteId
     * @param int $customerGroupId
     * @param string $couponCode
     * @param string|null $now
     * @use $this->addWebsiteGroupDateFilter()
     *
     * @return Mage_SalesRule_Model_Resource_Rule_Collection
     */
    public function setValidationFilter($websiteId, $customerGroupId, $couponCode = '', $now = null)
    {
        if (!$this->getFlag('validation_filter')) {
            parent::setValidationFilter($websiteId, $customerGroupId, $couponCode, $now);

            if (!strlen($couponCode)) {
                return $this;
            }

            $connection = $this->getConnection();

            $noCoupon = $this->baseSelectForUnion();
            $noCoupon->where($connection->quoteInto(
                'main_table.coupon_type = ? ',
                Mage_SalesRule_Model_Rule::COUPON_TYPE_NO_COUPON
            ));

            $yesCoupon = $this->baseSelectForUnion();
            $yesCoupon->where($this->yesCouponWhere(), $couponCode);

            $subselect = $connection->select()->union(array(
                $noCoupon,
                $yesCoupon,
            ));

            $this->getSelect()->reset();
            $this->getSelect()->from(array('main_table' => $subselect));
        }

        return $this;
    }

    /**
     * Get a select to use for the UNION
     *
     * Discards the last applied WHERE condition (they will be applied
     * separately and UNION-ed)
     *
     * @return Varien_Db_Select
     */
    protected function baseSelectForUnion()
    {
        $select = clone $this->getSelect();
        $where = $select->getPart('where');
        array_pop($where);
        $select->setPart('where', $where);

        return $select;
    }

    /**
     * Get the WHERE for the yes coupon SELECT.
     *
     * This logic can be found in setValidationFilter() in the parent.
     *
     * @return string
     */
    protected function yesCouponWhere()
    {
        $connection = $this->getConnection();

        $orWhereConditions = array(
            $connection->quoteInto(
                '(main_table.coupon_type = ? AND rule_coupons.type = 0)',
                Mage_SalesRule_Model_Rule::COUPON_TYPE_AUTO
            ),
            $connection->quoteInto(
                '(main_table.coupon_type = ? AND main_table.use_auto_generation = 1 AND rule_coupons.type = 1)',
                Mage_SalesRule_Model_Rule::COUPON_TYPE_SPECIFIC
            ),
            $connection->quoteInto(
                '(main_table.coupon_type = ? AND main_table.use_auto_generation = 0 AND rule_coupons.type = 0)',
                Mage_SalesRule_Model_Rule::COUPON_TYPE_SPECIFIC
            ),
        );
        $orWhereCondition = implode(' OR ', $orWhereConditions);

        return '(' . $orWhereCondition . ') AND rule_coupons.code = ?';
    }
}
```

### The Improved `SELECT`

Now, our refactored `Mage_SalesRule_Model_Resource_Rule_Collection ` class will generate the following `SELECT`...

```sql
SELECT `main_table`.* FROM (
  SELECT `main_table`.*, `rule_coupons`.`code`
  FROM `salesrule` AS `main_table`
    INNER JOIN `salesrule_customer_group` AS `customer_group_ids`
      ON main_table.rule_id = customer_group_ids.rule_id
      AND customer_group_ids.customer_group_id = 1
    LEFT JOIN `salesrule_coupon` AS `rule_coupons`
      ON main_table.rule_id = rule_coupons.rule_id
      AND main_table.coupon_type != 1
    WHERE (EXISTS (SELECT 1 FROM `salesrule_website` AS `website` WHERE (website.website_id IN (1)) AND (main_table.rule_id = website.rule_id)))
    AND (from_date is null or from_date <= '2017-01-14')
    AND (to_date is null or to_date >= '2017-01-14')
    AND (`is_active` = '1')
    AND (main_table.coupon_type = 1 )

  UNION

  SELECT `main_table`.*, `rule_coupons`.`code`
  FROM `salesrule` AS `main_table`
    INNER JOIN `salesrule_customer_group` AS `customer_group_ids`
      ON main_table.rule_id = customer_group_ids.rule_id
      AND customer_group_ids.customer_group_id = 1
    LEFT JOIN `salesrule_coupon` AS `rule_coupons`
      ON main_table.rule_id = rule_coupons.rule_id
      AND main_table.coupon_type != 1
  WHERE (EXISTS (SELECT 1 FROM `salesrule_website` AS `website` WHERE (website.website_id IN (1)) AND (main_table.rule_id = website.rule_id)))
  AND (from_date is null or from_date <= '2017-01-14')
  AND (to_date is null or to_date >= '2017-01-14')
  AND (`is_active` = '1')
  AND (((main_table.coupon_type = 3 AND rule_coupons.type = 0)
    OR (main_table.coupon_type = 2 AND main_table.use_auto_generation = 1 AND rule_coupons.type = 1)
    OR (main_table.coupon_type = 2 AND main_table.use_auto_generation = 0 AND rule_coupons.type = 0))
  AND rule_coupons.code = 'XXXXXXXXX')
) AS `main_table` ORDER BY sort_order ASC
```

This query executes in just a few milliseconds.

### What About Magento 2?

While I solved this issue for a site running Magento 1, looking at `Magento\Quote\Model\Quote\Address\Collection::setValidationFilter()` in the latest M2 codebase (v2.1.5) I can see this is still an issue.

### Gotchas

Keep in mind that this change causes `Mage_SalesRule_Model_Resource_Rule_Collection`'s internal `SELECT` to differ from the `SELECT` generated by core code. When I first wrote this code I found that we ran into issues with Bronto code which made assumptions about what `Mage_SalesRule_Model_Resource_Rule_Collection` would return after calling `setValidationFilter`.

```php?start_inline=1
$rules = Mage::getModel('salesrule/rule')
    ->getCollection()
    ->setValidationFilter($websiteId, $customerGroupId, $couponCode)
    ->addFieldToFilter('main_table.coupon_type', array('in' => array(Mage_SalesRule_Model_Rule::COUPON_TYPE_SPECIFIC, Mage_SalesRule_Model_Rule::COUPON_TYPE_AUTO)));
```

The subselect with the `main_table` alias was added to workaround this.

### Conclusion

I hope that some of you found this post helpful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
