---
layout: blog-single
title: "ERROR 1180 (HY000): Got error 5 \"Input/output error\" during COMMIT While Importing a mysqldump"
date: June 11, 2020
image: 
tags: [MySQL]
---

Recently, when attempting to import a database backup taken with `mysqldump`, I experienced the following error:

```
ERROR 1180 (HY000) at line 23703: Got error 5 "Input/output error" during COMMIT
```

A quick Google search lead me to Percona's ["How Big Can Your Galera Transaction Be"](https://www.percona.com/blog/2015/10/26/how-big-can-your-galera-transactions-be/), which suggested that this error can occur when attempting to commit a large amount of data in a transaction. I checked the MariaDB error logs and sure enough found record that that's what was happening here:

```
200611 11:24:34 [Warning] WSREP: transaction size limit (2147483647) exceeded: 2147483648
```

<!-- excerpt_separator -->

Per the error message, the environment had `wsrep_max_ws_size ` configured as `2147483647` (2 GB), which is as large is it can go<sup style="display: inline-block" id="a1">[1](#f1)</sup>. It seemed strange to me that importing a `mysqldump` would lead to a 2 GB transaction. I took a quick look at line 23702 (the line right before the error). It looked like this:

```
INSERT INTO `quote_address` VALUES (17859663......);
```

I found it hard to believe that mysqldump would generate a 2 GB `INSERT INTO` statement, so I checked how many bytes were on that line:

```
$ zcat dump.sql.gz | tail -n +23702 | head -n 1 | wc -c
824564
```

Not anywhere near 2GB.

I looked more closely at the dump and found this leading up to the first `INSERT INTO` statement for the `quote_address` table.

```
LOCK TABLES `quote_address` WRITE;
/*!40000 ALTER TABLE `quote_address` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `quote_address` VALUES (6
```

The `set autocommit=0` statement caught my eyes.

I did a little digging and found that [the tool that was used for the backup](https://github.com/magento/ece-tools/blob/2002.0.23/src/DB/Dump.php#L52) used the `--no-autocommit` flag when running the dump. In a local environment I did some experimentation and found that what this does is wrap all the `INSERT INTO` statements for each table with a `set autocommit=0` flag, followed by the `INSERT INTO` statements, and finally followed by a `commit;`. 

```
set autocommit=0;
INSERT INTO...;
INSERT INTO...;
INSERT INTO...;
commit;
```

In other words, it was causing the entire table to be inserted in one transaction, rather than executing each `INSERT INTO` on a line-by-line basis (which is the default behavior when importing a `mysqldump`).

The benefit to this is that if the import process fails in the middle of a table, the table will not be left with partial data. However, in our case the problem it was causing was much worse than the benefit.

I suggested we pipe the `mysqldump` file through `sed` to strip out the `set autocommit=0` and `commit;` statements prior to sending to MariaDB.

```
zcat dump.sql.gz | sed '/set autocommit=0;/d' | sed '/commit;/d' | mysql mydb
```

Using this strategy we were able to import the backup successfully.

### Footnotes

<b id="f1">1 </b>. Percona's blog post does suggest you may still be able to increase the limit beyond 2 GB, although I haven't personally tested it.[↩](#a1)