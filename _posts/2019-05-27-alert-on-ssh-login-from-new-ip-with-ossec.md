---
layout: blog-single
title:  "Alert on SSH Login from new IP with OSSEC"
description: "How to configure OSSEC to send an alert on SSH login from new IP"
date: May 27, 2019
image: 
tags: [Tools, Security, Sysadmin]
---

A useful security alert condition is a login from a new IP address. In this post we'll explore how to set this up with [OSSEC](https://www.ossec.net/).

<!-- excerpt_separator -->

### The "First time user logged in" alert

By default OSSEC sends an alert the first time a user logs in. We can use `ossec-logtest` to observe this:

```
$ cat ossec-lest-log
May 22 02:13:22 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ
$ cat ossec-test-log | /var/ossec/bin/ossec-logtest 
2019/05/28 00:24:33 ossec-testrule: INFO: Reading local decoder file.
2019/05/28 00:24:33 ossec-testrule: INFO: Started (pid: 5253).
2019/05/28 00:24:33 ossec-testrule: INFO: Started (pid: 5253).
ossec-testrule: Type one log per line.



**Phase 1: Completed pre-decoding.
       full event: 'May 22 02:13:22 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'
       hostname: 'localhost'
       program_name: 'sshd'
       log: 'Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'

**Phase 2: Completed decoding.
       decoder: 'sshd'
       dstuser: 'vagrant'
       srcip: '10.0.2.2'

**Phase 3: Completed filtering (rules).
       Rule id: '10100'
       Level: '4'
       Description: 'First time user logged in.'
**Alert to be generated.
```

When we have two logins from separate IPs the "First time user logged in" alert only first on the first login (as expected)...

```
$ cat ossec-test-log-2
May 22 02:13:22 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ
May 22 02:13:33 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.3 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ
$ cat ossec-test-log-2 | /var/ossec/bin/ossec-logtest 
2019/05/28 00:26:25 ossec-testrule: INFO: Reading local decoder file.
2019/05/28 00:26:25 ossec-testrule: INFO: Started (pid: 5255).
ossec-testrule: Type one log per line.



**Phase 1: Completed pre-decoding.
       full event: 'May 22 02:13:22 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'
       hostname: 'localhost'
       program_name: 'sshd'
       log: 'Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'

**Phase 2: Completed decoding.
       decoder: 'sshd'
       dstuser: 'vagrant'
       srcip: '10.0.2.2'

**Phase 3: Completed filtering (rules).
       Rule id: '10100'
       Level: '4'
       Description: 'First time user logged in.'
**Alert to be generated.




**Phase 1: Completed pre-decoding.
       full event: 'May 22 02:13:33 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.3 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'
       hostname: 'localhost'
       program_name: 'sshd'
       log: 'Accepted publickey for vagrant from 10.0.2.3 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'

**Phase 2: Completed decoding.
       decoder: 'sshd'
       dstuser: 'vagrant'
       srcip: '10.0.2.3'

**Phase 3: Completed filtering (rules).
       Rule id: '5715'
       Level: '3'
       Description: 'SSHD authentication success.'
**Alert to be generated.
```

### `<if_fts>` and `<fts>`

We can see the configuration of the rule in `/var/ossec/rules/syslog_rules.xml`

```xml
<group name="syslog,fts,">
  <rule id="10100" level="4">
    <if_group>authentication_success</if_group>
    <options>alert_by_email</options>
    <if_fts></if_fts>
    <group>authentication_success</group>
    <description>First time user logged in.</description>
  </rule>
</group>
```

There's not much official documentation on this, but the `<if_fts>` tag is the key to the operation of the alert.

### The Decoder

`fts` (first time seen) is set by the decoder. If you look in `/var/ossec/etc/decoder.xml` you'll see the following:


```xml
<decoder name="sshd-success">
  <parent>sshd</parent>
  <prematch>^Accepted</prematch>
  <regex offset="after_prematch">^ \S+ for (\S+) from (\S+) port </regex>
  <order>user, srcip</order>
  <fts>name, user, location</fts>
</decoder>
```

In the `<fts>` node you'll see it uses `name`, `user` and `location`. If we add `srcip` to the `fts` node we can track new logins by IP.

<div class="tout tout--secondary">
<p><b>NOTE:</b> It seems less than ideal to modify <code>decoders.xml</code> directly to make this change, however, per <a href="https://blog.rapid7.com/2016/08/31/ossec-series-configuration-pitfalls/">this</a> blog post there is no way to override decoders in OSSEC.</p>
</div>


```xml
<decoder name="sshd-success">
  <parent>sshd</parent>
  <prematch>^Accepted</prematch>
  <regex offset="after_prematch">^ \S+ for (\S+) from (\S+) port </regex>
  <order>user, srcip</order>
  <fts>name, user, location, srcip</fts>
</decoder>
```

### Re-Testing

Now you'll see that if you test with `ossec-logtest` again it alerts "First time user logged in" for each new IP.

```
# cat ossec-test-log | /var/ossec/bin/ossec-logtest 
2019/05/28 00:33:24 ossec-testrule: INFO: Reading local decoder file.
2019/05/28 00:33:24 ossec-testrule: INFO: Started (pid: 5275).
ossec-testrule: Type one log per line.



**Phase 1: Completed pre-decoding.
       full event: 'May 22 02:13:22 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'
       hostname: 'localhost'
       program_name: 'sshd'
       log: 'Accepted publickey for vagrant from 10.0.2.2 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'

**Phase 2: Completed decoding.
       decoder: 'sshd'
       dstuser: 'vagrant'
       srcip: '10.0.2.2'

**Phase 3: Completed filtering (rules).
       Rule id: '10100'
       Level: '4'
       Description: 'First time user logged in.'
**Alert to be generated.




**Phase 1: Completed pre-decoding.
       full event: 'May 22 02:13:33 localhost sshd[13949]: Accepted publickey for vagrant from 10.0.2.3 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'
       hostname: 'localhost'
       program_name: 'sshd'
       log: 'Accepted publickey for vagrant from 10.0.2.3 port 64565 ssh2: RSA SHA256:WeegtaAAFxNXdrRFSJfQ7Yc1sJQLOqYZTzr4uRjByyQ'

**Phase 2: Completed decoding.
       decoder: 'sshd'
       dstuser: 'vagrant'
       srcip: '10.0.2.3'

**Phase 3: Completed filtering (rules).
       Rule id: '10100'
       Level: '4'
       Description: 'First time user logged in.'
**Alert to be generated.
``` 