---
layout: blog-single
title:  "OSSEC local install from package"
description: "How to do an OSSEC local install from a package"
date: May 25, 2019
image: 
tags: [Tools, Security, Sysadmin]
---

If you read [OSSEC's installation documentation](https://www.ossec.net/docs/manual/installation/install-source.html), you'll learn that there are 4 installation types: server, agent, local and hybrid. While there's no official documentation explaining this, per [this Google Groups thread](https://groups.google.com/forum/#!topic/ossec-list/2LlVOs_OKyY) a local install is equivalent to a standalone install on a single system.

<!-- excerpt_separator -->

OSSEC's documentation states that the installation type can be selected when using the `install.sh` wizard. However, I prefer [package installation](https://www.ossec.net/docs/manual/installation/installation-package.html) whenever possible. Unfortunately I couldn't find any documentation on this.

Eventually I was able to figure out what is documented in [this GitHub issue](https://github.com/ossec/ossec-hids/issues/1560). Essentially, you just do a server install and that is the same as a local install.

Download the yum packages

```
$ wget -q -O - https://updates.atomicorp.com/installers/atomic |sh
$ yum install ossec-hids ossec-hids-server
```

Next start the server

```
$ /var/ossec/bin/ossec-control start
```

OSSEC server is now running on the box and sending alerts to `/var/ossec/logs/alerts/`.
