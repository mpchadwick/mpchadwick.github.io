---
layout: blog-single
title:  "Finding Largest Tables in MySQL 8 / MariaDB 10.2"
date: January 8, 2021
image: 
tags: [MySQL]
related_posts:
- "Clearing a Backlog of MySQL Queries"
- "Resuming a Failed MySQL Import"
- "Limiting Access To Specific Tables in MySQL - Cheatsheat"
---

If you're like me the Percona blog's ["Finding the largest tables on MySQL Server"](https://www.percona.com/blog/2008/02/04/finding-out-largest-tables-on-mysql-server/) from 2008 is a resource you frequently visit.

However, when running the query recently I experienced the following error:

```
ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'rows,
```
{:.wrap}

<!-- excerpt_separator -->

Playing around a little bit I determined that the issue was caused by the fact that the query in the Percona article uses `rows` as an identifier name without quoting.

It turns out that [as of MySQL version 8.0.2](https://dev.mysql.com/doc/refman/8.0/en/keywords.html#keywords-8-0-detailed-R) and [MariaDB version 10.2.4](https://mariadb.com/kb/en/mariadb-1024-release-notes/) `rows` is now a reserved word and cannot be used as an identifier name without being quoted.

All that's needed to resolve the issue is to quote rows like this: `` `rows` ``.

Here's the updated full query that's compatible with MySQL 8 / MariaDB 10.2:

```
SELECT CONCAT(table_schema, '.', table_name),
       CONCAT(ROUND(table_rows / 1000000, 2), 'M')                                    `rows`,
       CONCAT(ROUND(data_length / ( 1024 * 1024 * 1024 ), 2), 'G')                    DATA,
       CONCAT(ROUND(index_length / ( 1024 * 1024 * 1024 ), 2), 'G')                   idx,
       CONCAT(ROUND(( data_length + index_length ) / ( 1024 * 1024 * 1024 ), 2), 'G') total_size,
       ROUND(index_length / data_length, 2)                                           idxfrac
FROM   information_schema.TABLES
ORDER  BY data_length + index_length DESC
LIMIT  10;
```
