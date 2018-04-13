---
layout: blog-single
title:  "Exporting Your Browser Cookies on a Mac (Chrome, Firefox, Safari)"
description: A look at how to export cookies from your browser on a Mac with Chrome, Firefox and Safari
date: April 12, 2018
image: /img/blog/mac-export-cookies/firefox@2x.jpg
tags: [Security]
---

Recently, for some research I've been doing I've had the desire to get an export of all my browser cookies. I wound up taking a look at how to do this the three browsers I use, Chrome, Firefox and Safari. In this post I'll document my findings.

<!-- excerpt_separator -->

<div class="tout tout--secondary">
<p><strong>NOTE</strong>: Note that the below is accurate as April, 2018 when this article was published. Browser vendors may have made changes since then which could impact the accuracy.</p>
</div>

### Chrome

Chrome stores your cookies in your profile folder within `~/Library/Application Support/Google/Chrome`. For me, there's a folder `Profile 1` within that directory with a file named `Cookies`. That file is actually an sqlite database with all your cookies. They are stored in a table named `cookies`.

```
$ pwd
/Users/maxchadwick/Library/Application Support/Google/Chrome/Profile 1
$ sqlite3
SQLite version 3.19.3 2017-06-27 16:48:08
Enter ".help" for usage hints.
Connected to a transient in-memory database.
Use ".open FILENAME" to reopen on a persistent database.
sqlite> .open Cookies
sqlite> .schema --indent cookies
CREATE TABLE cookies(
  creation_utc INTEGER NOT NULL UNIQUE PRIMARY KEY,
  host_key TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  path TEXT NOT NULL,
  expires_utc INTEGER NOT NULL,
  secure INTEGER NOT NULL,
  httponly INTEGER NOT NULL,
  last_access_utc INTEGER NOT NULL,
  has_expires INTEGER NOT NULL DEFAULT 1,
  persistent INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 1,
  encrypted_value BLOB DEFAULT '',
  firstpartyonly INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX domain ON cookies(host_key);
CREATE INDEX is_transient ON cookies(persistent) where persistent != 1;
sqlite>
```

The cookie values are actually stored in the `encrypted_value` column.

Fortunately, [this python script](https://stackoverflow.com/questions/23153159/decrypting-chromium-cookies/23727331#23727331) can be used to decrypt them.

You will need to supply it with your Chrome Safe Storage password. Per the["Decrypt Chrome Cookies with Python"](https://n8henrie.com/2014/05/decrypt-chrome-cookies-with-python/) blog post, the following command can be used to pull that...

```
security find-generic-password -w -s "Chrome Safe Storage"
```

### Firefox

Similar to Chrome, Firefox uses a sqlite database for storing your cookies. The good news is that they're not encrypted, which simplifies the process of extracting them.

To find the path, click the "Troubleshooting Information" menu item under the Help menu. Then, click the "Show in Finder" button next to "Profile Folder".

<img
  class="rounded shadow"
  src="/img/blog/mac-export-cookies/firefox@1x.jpg"
  srcset="/img/blog/mac-export-cookies/firefox@1x.jpg 1x, /img/blog/mac-export-cookies/firefox@2x.jpg 2x"
  alt="A screenshot showing the Show In Finder button for your Firefox profile">

In that folder you'll see a file named `cookies.sqlite`.

The cookies are stored in the `moz_cookies` table, with the values in the `value` column...

```
$ pwd
/Users/maxchadwick/Library/Application Support/Firefox/Profiles/56qqyyl6.default
$ sqlite3
SQLite version 3.19.3 2017-06-27 16:48:08
Enter ".help" for usage hints.
Connected to a transient in-memory database.
Use ".open FILENAME" to reopen on a persistent database.
sqlite> .open cookies.sqlite
sqlite> .schema --indent moz_cookies
CREATE TABLE IF NOT EXISTS "moz_cookies"(
  id INTEGER PRIMARY KEY,
  baseDomain TEXT,
  originAttributes TEXT NOT NULL DEFAULT '',
  name TEXT,
  value TEXT,
  host TEXT,
  path TEXT,
  expiry INTEGER,
  lastAccessed INTEGER,
  creationTime INTEGER,
  isSecure INTEGER,
  isHttpOnly INTEGER,
  inBrowserElement INTEGER DEFAULT 0,
  sameSite INTEGER,
  CONSTRAINT moz_uniqueid UNIQUE(name, host, path, originAttributes)
);
CREATE INDEX moz_basedomain ON moz_cookies(baseDomain, originAttributes);
```

### Safari

Safari stores it's cookies in `~/Library/Cookies`. There you'll find a file named `Cookies.binarycookies`.

The data is in binary format, but again, there's [an excellent python script](http://securitylearn.net/wp-content/uploads/tools/iOS/BinaryCookieReader.py) which can be used for parsing.