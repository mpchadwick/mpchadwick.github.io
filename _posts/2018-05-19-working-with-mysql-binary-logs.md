---
layout: blog-single
title:  "Working with MySQL Binary&nbsp;Logs"
description: My guide to working with MySQL's binary logs
date: May 19, 2018
image:
tags: [MySQL]
---

[Binary Logs](https://dev.mysql.com/doc/refman/5.7/en/binary-log.html) are a useful feature in MySQL. Mainly intended for master / slave [replication](https://dev.mysql.com/doc/refman/5.7/en/replication.html) setups and [point-in-time recovery](https://dev.mysql.com/doc/refman/5.7/en/point-in-time-recovery.html) they contain records of all changes to the MySQL database, including schema alterations and table creations, but also `INSERT`, `UPDATE` and `DELETE` statements.  This makes them extremely useful in offering system audit-ability to do things like forensic analysis in the case of a security breach or answer questions like "why does this product keep getting disabled on my website?".

This post answers some common questions you might have while working with them...

<!-- excerpt_separator -->

### Checking If Binary Logs Are Enabled

The `log_bin` system variable will tell you if binary logs are enabled.

```
mysql> SHOW VARIABLES LIKE 'log_bin';
```

This value cannot be changed at runtime and requires a MySQL restart to change.

While the `log_bin` system variable reports whether or not binary logging is enabled, the `--log-bin` server option specifies the location to the binary location. This can be done in `[mysqld]` stanza of `/etc/my.cnf` as follows...

```
log-bin = /var/lib/mysql/bin-log
```

Doing so will enable binary logging (there are some other options you'll want to set as well...make sure to read this full post).

### Finding The Binary Logs

The `log_bin_basename` system variable will tell you where the bin logs are located

```
mysql> SHOW VARIABLES LIKE 'log_bin_basename';
```

As mentioned above in "Checking If Binary Logs Are Enabled", this value is set with the `--log-bin` server option. Again, typically in `/etc/my.cnf` you'll see something like this...

```
log-bin = /var/lib/mysql/bin-log
```

The `SHOW BINARY LOGS` statement can be used to get a list of binary log files on the server.

```
mysql> SHOW BINARY LOGS;
```

### How Binary Logs Are Rotated

The `max_binlog_size` variable can be consulted and changed at runtime to control the maximum size per binlog file

```
mysql> SHOW VARIABLES LIKE 'max_binlog_size'
```

The default value is 1073741824 bytes... around 1G, which is also the maximum value.

The `expire_logs_days` variable can be consulted and changed at runtime to control the number of days binary logs are stored for. **This defaults to 0, meaning no automatic removal**. This can also be added to `/etc/my.cnf`

```
expire_logs_days = 14
```

### Binary Log Formats

There are 3 options for binary log format...

- Row
- Statement
- Mixed

The specifics of these formats are detailed in the ["Replication Formats"](https://dev.mysql.com/doc/refman/5.7/en/replication-formats.html) page from the MySQL documentation. However, from a high level...

- **Statement-based** - Logs the *actual* SQL queries that are executed
- **Row-based** - Logs *events* that indicate how table rows are changed
- **Mixed** - Uses statement-based by default, but under certain circumstances switches to row-based.

MySQL defaults to row-based logging as of v5.7.7 (previously it was statement-based), however for the audit-ability use case statement-based logging is more convenient.

The `binlog_format` variable can be consulted and changed at runtime to control binary log format.

```
mysql> SHOW VARIABLES LIKE 'binlog_format';
```

It can also be set in `my.cnf` as follows

```
binlog-format = STATEMENT
```

### Reading The Binary Logs

The `mysqlbinlog` command can be used to read the contents of the bin log. The output can be piped to commands such as `tail`, `head`, `grep` or `less`.

```
$ sudo mysqlbinlog /var/lib/mysql/bin-log | tail
```

The article ["15 mysqlbinlog Command Examples for MySQL Binary Log Files"](https://www.thegeekstuff.com/2017/08/mysqlbinlog-examples/) documents some of the useful flags the `mysqlbinlog` utility offers such as `--start-datetime` and  `--end-datetime`. The `man` page is also provides some useful information.

### Translating Row-based Binary Logsd to SQL

The `-v` (`--verbose`) flag can be used to translate row-based MySQL binary logs to "pseudo-sql".

```
$ sudo mysqlbinlog -v /var/lib/mysql/bin-log | less
```

### Enabling The Binary Logs

As mentioned in "Checking If Binary Logs Are Enabled" enabling binary logging requires a mysql restart.

Typically you'll specify the required startup options within the `[mysqld]` stanza of the `/etc/my.cnf` file. For example...

```
[mysqld]

# Other options
# go here

## Replication
server-id=0
binlog-format = STATEMENT
expire_logs_days = 14
log-bin = /var/lib/mysql/bin-log
```

Note that per MySQL's ["Server System Variables"](https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html#sysvar_server_id) documentation in MySQL 5.7 the `server-id` is required if binary logging is enabled. Otherwise MySQL will refuse to start.

Test your changes in a non-production environment first and schedule a maintenance window for making them in production!