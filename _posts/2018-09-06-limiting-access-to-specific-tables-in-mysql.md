---
layout: blog-single
title:  "Limiting Access To Specific Tables in MySQL - Cheatsheat"
description: A cheatsheet covering how to limit access to specific table in MySQL
date: September 6, 2018
image: 
tags: [MySQL]
---

One of the core principles in the infosec field is [the principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege). The idea is to limit permitted access by systems or processes as much as humanly possible. Applied to MySQL, in some circumstances this could mean only allowing access to specific tables for some user. This is a quick cheatsheet for working with table-level access in MySQL.

<!-- excerpt_separator -->

### Granting Access to Specific Tables

Granting access to specific tables can be done via a [`GRANT` statement](https://dev.mysql.com/doc/refman/5.7/en/grant.html). Here's an example...

```
GRANT SELECT ON db.table TO 'user'@'localhost';
```

### Showing Table Grants

The easiest way to see table level grants is via a [`SHOW GRANTS` statement](https://dev.mysql.com/doc/refman/5.7/en/show-grants.html)

```
SHOW GRANTS FOR 'user'@'localhost'
+-------------------------------------------------------------------------------------------------------------+
| Grants for user@localhost                                                                                   |
+-------------------------------------------------------------------------------------------------------------+
| GRANT USAGE ON *.* TO 'user'@'localhost' IDENTIFIED BY PASSWORD '*2470C0C06DEE42FD1618BB99005ADCA2EC9D1E19' |
| GRANT SELECT ON `db`.`table` TO 'localhost'                                                                 |
+-------------------------------------------------------------------------------------------------------------+
```

Some Googling on this may lead you to check `mysql.user`, but you won't find table level permissions there.

### Revoking Access To Specific Tables

If you make a mistake in your granting or later find that a user no longer needs access a [`REVOKE` statement](https://dev.mysql.com/doc/refman/5.7/en/revoke.html) can be used to remove access to specific tables...

```
REVOKE SELECT ON db.table FROM 'user'@'localhost';
```