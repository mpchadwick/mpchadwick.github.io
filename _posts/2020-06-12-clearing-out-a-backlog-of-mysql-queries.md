---
layout: blog-single
title: "Clearing a Backlog of MySQL Queries"
date: June 12, 2020
image: 
tags: [MySQL]
---

<div class="tout tout--secondary">
<p><strong>WARNING</strong> Proceed with caution</p>
</div>

Sometimes, for one reason or another, MySQL may get in a state where it has a massive backlog of queries to process. In these types of situations, your application will likely be experiencing major performance issues. Additionally MySQL (and your application) will likely struggle to regain stability without human intervention. While restarting the MySQL process could be an option, that comes with a lot of risk. Another option, is to selectively [`kill`](https://dev.mysql.com/doc/refman/5.7/en/kill.html) certain queries.

<!-- excerpt_separator -->

 In these cases there may be hundreds of active queries making it infeasible to `kill` each query one by one.
 
 Here's an example bash command that could be used to clear a large backlog of queries:
 
<div class="tout tout--secondary">
<p>In this example there's a large backup of <code>SELECT</code> queries against a table named <code>catalog_product_flat_1</code></p>
</div>
 
 
```
mysql -e "SHOW FULL PROCESSLIST" | grep 'SELECT' | grep 'catalog_product_flat_1' | awk '{ print $1; }' | xargs -n1 mysqladmin kill
```
{:.wrap}
 
If the backlog is big enough that it's preventing you from establishing a connection you can retry the command in a loop.
 
```
while true; do
  mysql -e "SHOW FULL PROCESSLIST" | grep 'SELECT' | grep 'catalog_product_flat_1' | awk '{ print $1; }' | xargs -n1 mysqladmin kill
  sleep 1
done
```
{:.wrap}