---
layout: blog-single
title:  "Lessons Learned During a Recent Magento 2 Deploy"
description: During a recent Magento deploy I learned some interesting things, which I share in this post.
date: May 17, 2018
image:
tags: [Magento]
---

I had an interesting Magento 2 deployment experience recently. I learned quite a few things in the process, and wanted to share them here.

<!-- excerpt_separator -->

### "It's Stuck"

A co-worker was assigned to handle the deploy, but I was on call in case escalation was required. I got a ping from my co-worker that the deploy had been hanging on `setup:upgrade` for an unusual amount of time.

I got on the server and attached an [`strace`](https://linux.die.net/man/1/strace) to the process. It was hanging on `restart_syscall`...

```
$ strace -p17555 -f
Process 17555 attached
restart_syscall(<... resuming interrupted call ...>
```

I did some Googling and the best explanation I could find of how to interpret this is in an answer to the ["How do you interpret `strace` on an apache process returning `restart_syscall`"](https://serverfault.com/questions/444188/how-do-you-interpret-strace-on-an-apache-process-returning-restart-syscall?rq=1) Server Fault question...

> That line means that the current system call was interrupted by your strace and that strace asked to re-run it. I think that the process you are tracing is sleeping.

Bottom line is it wasn't a good sign that the `strace` was showing the process as hung on `restart_syscall`.

### Re-trying the deploy

We agreed to cancel the current deployment and re-attempt it. Maybe it would just magically work the second time around, but more importantly, we could also get an `strace` going on `setup:upgrade` **before** it got stuck.

### Watching The strace - Learning #1

As I watched the strace one thing I noticed was that an insane amount of time was being spent opening and accessing files in `var/` and `pub/media`.

```
stat("/var/www/html/var/report/1286546962302", {st_mode=S_IFREG|0664, st_size=10133, ...}) = 0
access("/var/www/html/var/report/1286546962302", W_OK) = 0
lstat("/var/www/html/var/report/1159876265576", {st_mode=S_IFREG|0664, st_size=10133, ...}) = 0
stat("/var/www/html/var/report/1159876265576", {st_mode=S_IFREG|0664, st_size=10133, ...}) = 0
access("/var/www/html/var/report/1159876265576", W_OK) = 0
```

I did some quick research on this and it lead me to the ["Why my bin/magento setup:upgrade is really slow"](https://magento.stackexchange.com/questions/161987/why-my-bin-magento-setupupgrade-is-really-slow) question on the Magento Stack Exchange. One user answered the question by recommending `mv`-ing `pub/media` before running `setup:upgrade` and then `mv-ing` it back afterwards. 

 > We found out that we can increase the speed by moving the folder `pub/media/catalog` to `temp/media/catalog` before running `bin/magento setup:upgrade`.

This was really intriguing to me and I brought it up with my co-workers. 

One of my co-workers responded and let me know that this is because `setup:upgrade` runs a check on every file in `pub/media` and `var` to make sure that the current user has write access. This can be slow, especially over NFS. 

While the `mv` approach is definitely one way to solve it, he also let me know that there's a patch that Magento auto-applies when deploying to [Commerce Cloud](https://devdocs.magento.com/guides/v2.1/cloud/bk-cloud.html) that disables that check.

Upon further investigation I also found the post ["Improving performance when upgrading Magento 2 with Elastic File System"](https://www.maxpronko.com/blog/improving-performance-when-upgrading-magento-2-elastic-file-system) by [Max Pronko](https://www.maxpronko.com/) which suggests simply skipping the check for symlinks.

Either way, I'll be working with my team at [Something Digital](https://www.somethingdigital.com/) to review integrating a fix into our deploy process for non-Commerce Cloud projects.

### Getting Stuck Again - Learning #2

Eventually the command finished checking `pub/media` shortly after which it got stuck again. Fortunately, I had additional diagnostic info from the `strace`.

Looking at the `strace` I could see that is had just tried to run a `DROP TRIGGER` MySQL query...

```
access("/var/www/html/vendor/composer/../magento/framework/DB/Ddl/Trigger.php", F_OK) = 0
lstat("/var/www/html/vendor/composer/../magento/framework/DB/Ddl/Trigger.php", {st_mode=S_IFREG|0755, st_size=5736, ...}) = 0
open("/var/www/html/vendor/magento/framework/DB/Ddl/Trigger.php", O_RDONLY) = 13
fstat(13, {st_mode=S_IFREG|0755, st_size=5736, ...}) = 0
fstat(13, {st_mode=S_IFREG|0755, st_size=5736, ...}) = 0
fstat(13, {st_mode=S_IFREG|0755, st_size=5736, ...}) = 0
mmap(NULL, 5736, PROT_READ, MAP_SHARED, 13, 0) = 0x7f509c3aa000
munmap(0x7f509c3aa000, 5736)            = 0
close(13)                               = 0
sendto(6, "9\0\0\0\3SELECT `main_table`.* FROM "..., 61, MSG_DONTWAIT, NULL, 0) = 61
poll([{fd=6, events=POLLIN|POLLERR|POLLHUP}], 1, 1471228928) = 1 ([{fd=6, revents=POLLIN}])
recvfrom(6, "\1\0\0\1\6D\0\0\2\3def\tmage_prod\nmain_tab"..., 3072, MSG_DONTWAIT, NULL, NULL) = 1444
sendto(6, "Z\0\0\0\3SELECT `mview_state`.* FROM"..., 94, MSG_DONTWAIT, NULL, 0) = 94
poll([{fd=6, events=POLLIN|POLLERR|POLLHUP}], 1, 1471228928) = 1 ([{fd=6, revents=POLLIN}])
recvfrom(6, "\1\0\0\1\6E\0\0\2\3def\tmage_prod\vmview_st"..., 1628, MSG_DONTWAIT, NULL, NULL) = 449
sendto(6, "h\0\0\0\3SELECT `mview_state`.* FROM"..., 108, MSG_DONTWAIT, NULL, 0) = 108
poll([{fd=6, events=POLLIN|POLLERR|POLLHUP}], 1, 1471228928) = 1 ([{fd=6, revents=POLLIN}])
recvfrom(6, "\1\0\0\1\6E\0\0\2\3def\tmage_prod\vmview_st"..., 1179, MSG_DONTWAIT, NULL, NULL) = 449
sendto(6, "g\0\0\0\3SELECT `mview_state`.* FROM"..., 107, MSG_DONTWAIT, NULL, 0) = 107
poll([{fd=6, events=POLLIN|POLLERR|POLLHUP}], 1, 1471228928) = 1 ([{fd=6, revents=POLLIN}])
recvfrom(6, "\1\0\0\1\6E\0\0\2\3def\tmage_prod\vmview_st"..., 730, MSG_DONTWAIT, NULL, NULL) = 449
sendto(6, "A\0\0\0\3DROP TRIGGER IF EXISTS `trg"..., 69, MSG_DONTWAIT, NULL, 0) = 69
poll([{fd=6, events=POLLIN|POLLERR|POLLHUP}], 1, 1471228928
```

My next course of action was to connect to the database to check the `PROCESSLIST` and the `ENGINE INNODB STATUS`. Here's what I learned from the `PROCESSLIST` (note that query id 87913191 is truncated for brevity)...

```
mysql> SHOW FULL PROCESSLIST\G
*************************** 1. row ***************************
           Id: 87913191
         User: magento_user
         Host: magento-web3:36996
           db: magento_prod
      Command: Query
         Time: 56308
        State: Creating sort index
         Info:  /*
        Parent SKU - v191
        UPC - sku
        Type (Parent / Child) - cpe
        Title - v71
        .
        .
        .
        */
        SELECT
            vStyle.`value` AS `parent sku`,
            cpe.sku AS `sku`,
            cpe.type_id AS `type`,
            vTitle.`value` AS `title`,
            tDesc.`value` AS `description`,
            eBrand.`value` AS `brand name`,
		.
		.
		.
	FROM catalog_product_entity AS cpe
	JOIN catalog_product_entity_varchar AS vStyle
		ON cpe.entity_id = vStyle.row_id AND vStyle.attribute_id = 191 AND vStyle.store_id = 0
	LEFT JOIN catalog_product_super_link AS cpsl
		ON cpe.entity_id = cpsl.product_id
	/*child stuff*/
	JOIN catalog_product_entity_varchar AS vTitle
		ON vTitle.attribute_id = 71 AND vTitle.store_id = 0 AND ((cpe.row_id = vTitle.row_id AND cpe.type_id = "configurable") OR (cpsl.parent_id = vTitle.row_id AND cpe.type_id = "simple"))
	JOIN catalog_product_entity_int AS iBrand
		ON iBrand.attribute_id = 81 AND iBrand.store_id = 0 AND ((cpe.row_id = iBrand.row_id AND cpe.type_id = "configurable") OR (cpsl.parent_id = iBrand.row_id AND cpe.type_id = "simple"))
		JOIN eav_attribute_option_value AS eBrand
			ON iBrand.`value` = eBrand.option_id AND eBrand.store_id = 0
	.
	.
	.
	GROUP BY cpe.sku
	ORDER BY cpe.sku, mgv.position) AS img
	LIMIT 100
    Rows_sent: 0
Rows_examined: 1242249
*************************** 2. row ***************************
           Id: 88121455
         User: magento_user
         Host: magento-web3:36530
           db: magento_prod
      Command: Sleep
         Time: 5334
        State:
         Info: NULL
    Rows_sent: 0
Rows_examined: 0
*************************** 3. row ***************************
           Id: 88122191
         User: magento_user
         Host: magento-web3:40442
           db: magento_prod
      Command: Query
         Time: 117
        State: Waiting for table metadata lock
         Info: DROP TRIGGER IF EXISTS `trg_catalog_product_entity_after_insert`
    Rows_sent: 0
Rows_examined: 0
```

A-ha! So it was waiting on a lock. But what was holding the lock?

I did some quick Googling and found the article ["Who Holds the Metadata Lock? MySQL 5.7.3 Brings Help"](http://mysql.wisborg.dk/2014/01/13/who-holds-the-metadata-lock-mysql-5-7-3-brings-help/) that explains that information about what is holding a table metadata locks is only available from MySQL 5.7.3 and requires a non-standard configuration.

As such I decided to look in more detail at the process list to theorize what _might_ be holding the lock...

### The Strange SELECT query

The first thing that stood out to me was the `SELECT` query (id 87913191) that had been running for 56308 seconds. I quick seconds to hours conversion told me **the query had been running for literally almost 16 hours**.

It was also `SELECT`-ing `FROM` the `catalog_product_entity`, one of the tables at play with the `TRIGGER` that was being dropped.

But what would be issuing such a strange query and what might be the side effects if I `kill`-ed it...?

I `grep`-ed the code base for "`/*child stuff*/`" a comment which was included in the query. Strangely, that string was not present in any files in `vendor/` or `app/`. 

Looking more closely at the query it appeared that it was being used to generate some kind of report. As it was blocking the deploy and we were getting very close to finishing our scheduled window for the release I made the executive decision to `kill` the query.

```
mysql> kill 87913191;
```

Immediately I saw my `DROP TRIGGER` query complete in my `strace`. Success!

### Whodunnit


In the end, we determined that the slow query was run by an employee at the client in order to generate a report he needed. The fact that it had been running for nearly 16 hours when it blocked our deploy is definitely an issue. We'll be working to either optimize the query or set up a non-production MySQL instance for this type of usage.