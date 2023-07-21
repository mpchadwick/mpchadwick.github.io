---
layout: blog-single
title:  "Add an IP Address to a Fastly ACL via the CLI with Magento"
date: July 20, 2023
image: 
tags: [Magento]
related_posts:
---

Recently I was in a bit of a pickle on a new Magento project that my company was taking over.

Access to the staging site was restricted via Fastly. I had SSH access to the environment, but my IP address was not allowed via the ACL, so I couldn't connect to the website's backend UI to grant myself access.

I wound up figuring out how to manage this via the CLI. Since I struggled a bit with figuring this out I figured I'd shared my findings here.

<!-- excerpt_separator -->

### The Endpoint to Call

IP addresses can be added to an ACL via the ["Create an ACL entry"](https://developer.fastly.com/reference/api/acls/acl-entry/#create-acl-entry) resource.

The request looks like this

```
POST /service/[service_id]/acl/[acl_id]/entry
```

The IP address is then passed in the request body along with other parameters such as a comment

### Figuring Out The Service ID

Assuming you are using Magento Cloud the Service ID (and Fastly Key) can be found in the `/mnt/shared/fastly_tokens.txt` file. "API Token" is the `FASTLY_KEY` and "Serivce ID" is the `SERVICE_ID`.

### Finding the ACL ID

First, get the active version. You can do this as follows, assuming you have `jq` installed.

```
# Get the active version. In this example 105 is active
$ curl --silent -H "Fastly-Key: FASTLY_KEY" https://api.fastly.com/service/SERVICE_ID/version \
  | jq '.[] | if .active then .number else empty end'
105
```

Next review the list of ACLs for that version

```
$ curl --silent -H "Fastly-Key: FASTLY_KEY" https://api.fastly.com/service/SERVICE_ID/version/VERSION/acl | jq
```

Here you will find the id of the ACL you want to append to

### Adding the IP

You can certainly issue a curl request, but another option is to do this with `n98-magerun2 dev:console`, which is how I did it. The commands I ran looked like this...

```
$ XDG_CONFIG_HOME=~/var/ var/n98-magerun2.phar dev:console
>>> $api = $di->get('Fastly\Cdn\Model\Api')
>>> $api->upsertAclItem(ACL_ID, IP_TO_INSERT, null, COMMENT)
```

