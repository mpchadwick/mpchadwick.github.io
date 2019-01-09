---
layout: blog-single
title:  "Resuming a Failed MySQL Import"
description: Tips for resuming a failed MySQL import the right way.
date: January 8, 2019
image:
tags: [MySQL]
---

You may have a mysql import fail for any number of reasons. Most recently, I had an import fail with the following error.

```
ERROR 3 (HY000) at line 270457: Error writing file '/var/lib/mysqltmp/MLTmnake' (Errcode: 28 - No space left on device)
```
{:.wrap}

While the error implies that the disk ran out of space during import, the issue was in fact that [the disk ran out of inodes](https://stackoverflow.com/a/31460773).

Regardless of the reason of failure, you likely won't want to start the import over from the beginning.

Here I'll provide some tips for resuming the failed import.

<!-- excerpt_separator -->

### Pro Tip: Create A New File With Remaining Data (If Possible)

Your immediate temptation may be to craft a command to re-process the mysqldump file you previously tried to import, skipping the the lines already processed. However, if you have enough disk space I would strongly recommend you first to create a new file with only remaining data to be imported.

In my case I tried to re-import the same file again, skipping the lines that were already imported, but found that the command spent ~30 minutes just skipping over the already imported data.

If your attempts to resume a failed mysql import go completely smoothly you won't save any time by creating a new file, but if you hit an error you'll need to waste yet another 30 minutes (or more) skipping over already imported data once again.

Here's how you create the new file...

### Grab the Setup Lines

At the beginning of every `mysqldump` you'll see a section like this...

```sql
-- MySQL dump 10.13  Distrib 5.7.20, for osx10.13 (x86_64)
--
-- Host: localhost    Database: database
-- ------------------------------------------------------
-- Server version	5.7.20
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
```

You'll want to make sure to include these lines in your new file (or whenever you import a `mysqldump`) as you'll likely hit an a foreign key error if you don't.

To do this:

**1. Identify the line number for the last statement in the setup section**

<div class="tout tout--secondary">
<p><b>NOTE:</b> This assumes your mysqldump is gzipped</p>
</div>

You can find this by previewing the first ~50 lines with `less -N`

```
$ zcat database.sql.gz | head -n 50 | less -N
```

In the example below, line 16 would be the last line of the setup section

```sql
  1 -- MySQL dump 10.13  Distrib 5.7.20, for osx10.13 (x86_64)
  2 --
  3 -- Host: localhost    Database: magento_2_3_0_ee_b2b
  4 -- ------------------------------------------------------
  5 -- Server version       5.7.20
  6
  7 /*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
  8 /*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
  9 /*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 10 /*!40101 SET NAMES utf8 */;
 11 /*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
 12 /*!40103 SET TIME_ZONE='+00:00' */;
 13 /*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
 14 /*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
 15 /*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
 16 /*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
 17
 18 --
 19 -- Table structure for table `admin_passwords`
 20 --
 21
 22 DROP TABLE IF EXISTS `admin_passwords`;
 23 /*!40101 SET @saved_cs_client     = @@character_set_client */;
 24 /*!40101 SET character_set_client = utf8 */;
 25 CREATE TABLE `admin_passwords` (
 26   `password_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Password Id',
```

**2. Create a `.sql.gz` file just containing the setup lines**

Assuming the last line of the setup section is line 16 you'd do this...

```
$ zcat database.sql.gz | head -n 16 | gzip > setup.sql.gz
```

### Grab The Un-Imported Data

`zcat | tail -n + | gzip >` can be used to create a new file with just the un-imported data. For example, if the import error-ed a line 270457 the following command could be used

```
$ zcat database.sql.gz | tail -n +270457 | gzip > database-from-270457.sql.gz
```

However, it's a good idea to change the first `INSERT INTO` statement you'll be resuming from into an `INSERT IGNORE INTO` in case some of it was already imported.

Putting that together you get...

```
$ zcat database.sql.gz | tail -n +270457 | sed '0,/INSERT INTO/{s/INSERT INTO/INSERT IGNORE INTO/}' | > database-from-270457.sql.gz
```

### Combining The Setup Lines

The last thing you'll need to do is combine the setup lines with the un-imported data. Fortunately that's pretty simple...

```
$ cat setup.sql.gz database-from-270457.sql.gz > database-from-270457-with-setup.sql.gz
```

### Resuming the Import

Once you've created the new file, restart the import. Hopefully it'll go smoothly this time!