---
layout: blog-single
title: Foreign Key Constraints Are Business Decisions
description: Foreign Keys Constraints seem like a technical consideration at first glance, however, as I'll explain, their usage has business implications that need to be considered.
date: December 01, 2016
image:
tags: [Databases, Thoughts]
ad: domain-clamp-ad-b.html
---

A foreign key constraint is defined by Wikipedia as follows...

> A field (or collection of fields) in one table that uniquely identifies a row of another table or the same table.
 
Sounds pretty technical, right? Frequently, a developer uses his or her judgement when planning the architecture of some feature to decide when a foreign key is appropriate. However, I had an experience today where I learned that often, foreign key constraint enforcement is a business decision rather than a technical one.

<!-- excerpt_separator -->

### The Issue

The issue was reported by the client as follows...

> I'm getting a cryptic error message when I try to delete products in our catalog.

The "cryptic" error message is the typical error message you see from MySQL when an attempt is made to `DELETE` a row that has a column referenced as a foreign key on another table that is lacking `ON DELETE CASCADE`.

```
SQLSTATE[23000]: Integrity constraint violation: 1451 Cannot delete or update a parent row: a foreign key constraint fails (`my_db`.`project_item`, CONSTRAINT `FK_PRD_ID_PROJECT_PRD_ID` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ), query was: DELETE FROM `product` WHERE (id=49539)`
```
{:.wrap}

Looking at the issue, it turned out that a foreign key was added on a table called `project_item` for a column named `product_id`. This foreign key referenced the `id` column on a table named `product`. The foreign key was set to `ON DELETE NO ACTION`, meaning once a product was used in a project, the product could no longer be deleted.

While considering how to handle this issue report, I realized the developer who added the foreign key made an assumption about how the system should behave. Namely, he had assumed that a product should not be able to disappear from a project *ever* and thus added the `ON DELETE NO ACTION` foreign key. Clearly this behavior was not expected by the client.

### What We Did

At this point, I realized there really needed to be a business decision made by the client about how the system should function. There were a few options...

1. We could leave the system as is. The client would not be able to delete products that had, at one point, been added to projects. Presumably this was the original developers intention.
2. We could add `ON DELETE CASCADE` to the foreign key. When products are `DELETE`d the associated `project_item`s would also be deleted. Presumably this is what the developer was trying to avoid.
3. We could get rid of the foreign key all together. Products can be deleted and projects will still contain a reference to those products. There may be un-intended bugs in the application due to an assumption that all the products in a given project would always exist.

In the end he chose option 1, probably because it wouldn't require any development work...

### Conclusion

I hope that this article leads some developers to think twice before making assumptions when adding foreign keys as part of their database design. First and foremost, ask stakeholders, "How should the application behave?". In this case the question would be, "Should products that are in a given project be able to be deleted, and if so, what should happen?"

If you have any comments, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
