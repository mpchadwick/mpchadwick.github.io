---
layout: blog-single
title:  "Replication Lag Race Conditions in Magento"
description: A review of one of my favorite classification of bugs...race conditions caused by replication lag
date: September 7, 2018
image: 
tags: [Magento, MySQL, Debugging]
---

One of my favorite class of bugs are race conditions caused by replication lag (yes, I'm a masochist). These typically play out something like this...

- Application writes data to the master
- Application **immediately** tries to read that same data back from the slave
- Data hasn't replicated to slave yet, causing incorrect data to be read

I've run into a number of these both in core Magento as well as in 3rd party extensions. In this post I'll cover a couple of my favorites...

<!-- excerpt_separator -->

### Incorrect Usage Count For Sales Rules / Coupons

This was the first bug of this type that I've run into. I found this on a Magento 1 site in the `sales_order_afterPlace ` method of `Mage_SalesRule_Model_Observer`, however Magento 2 currently looks to have the same issue. The code is as follows...

```php
$rule->setTimesUsed($rule->getTimesUsed() + 1);
```

Under high concurrency the following can happen...

- Rule X starts out with `times_used` of 0
- User A places an order using Rule X. 0 times used is retrieved from the read slave (`$rule->getTimesUsed()`). `UPDATE` query is issued to set `times_used` to 0 + 1.
- User B also places an order using Rule X **and does so before User A's `UPDATE` query has replicated to slave**.`$rule->getTimesUsed()` still returns 0 from the slave. Another `UPDATE` is issued to yet again set `times_used` to 0 + 1.
- In the end both User A and User B have used the coupon, but `times_used` is still set to 1 as two queries have been issues to update `times_used` to 0 + 1 (instead of one query setting `times_used` to 0 + 1 and the next setting it to 1 + 1).

The solution to this problem, fortunately, is simple...increment `times_used` **without** consulting the slave to provide the current value. From a SQL standpoint the query needs to be changed like this...

**Before**

```sql
UPDATE salesrule_coupon SET times_used = 0 + 1;
```

**After**

```sql
UPDATE salesrule_coupon SET times_used = times_used + 1;
```

### All Users Removed From Role When Modifying Role

There's another fun replication lag race condition bug where saving a role causes all users assigned to the role to become unassigned. This one also was found on a Magento 1 site, but again appears to remain an issue in Magento 2.

In Magento 1 the trouble is in the `saveRoleAction()` method of `Mage_Adminhtml_Permissions_RoleController`, where, you'll find the following code...

```php
foreach($oldRoleUsers as $oUid) {
    $this->_deleteUserFromRole($oUid, $role->getId());
}

foreach ($roleUsers as $nRuid) {
    $this->_addUserToRole($nRuid, $role->getId());
}
```

`$oldRoleUsers` is an array with the ids all the users assigned to the role prior to save (when the page was loaded). `$roleUsers` is an array with the ids of all the users currently being saved to the role.

Astute readers may notice that this code is not particularly efficient as users who were present when the page is loaded AND when being saved will be unnecessarily removed from the role and then re-added.

But worse than the inefficiency is the race condition bug that can happen in the case of (even slight) replication lag...

The `_deleteUserFromRole` method will eventually wind up calling the `deleteFromRole` method on `Mage_Admin_Model_Resource_User`.

```php
public function deleteFromRole(Mage_Core_Model_Abstract $user)
{
    if ( $user->getUserId() <= 0 ) {
        return $this;
    }
    if ( $user->getRoleId() <= 0 ) {
        return $this;
    }

    $dbh = $this->_getWriteAdapter();

    $condition = array(
        'user_id = ?'   => (int) $user->getId(),
        'parent_id = ?' => (int) $user->getRoleId(),
    );

    $dbh->delete($this->getTable('admin/role'), $condition);
    return $this;
}
```

This will issue a `DELETE` query for the user record in the `admin_role` table (which will need to replicate to the slave).

The problem can be found back in `Mage_Adminhtml_Permissions_RoleController`'s `_addUserToRole` method, which looks like this...

```php
protected function _addUserToRole($userId, $roleId)
{
    $user = Mage::getModel('admin/user')->load($userId);
    $user->setRoleId($roleId)->setUserId($userId);

    if( $user->roleUserExists() === true ) {
        return false;
    } else {
        $user->add();
        return true;
    }
}
```

If it check passes the user won't be added back to the role...

```php
if( $user->roleUserExists() === true ) {
    return false;
```

`roleUserExists` checks for the record in the `admin_user` table that was previously deleted...

```php
public function roleUserExists(Mage_Core_Model_Abstract $user)
{
    if ( $user->getUserId() > 0 ) {
        $roleTable = $this->getTable('admin/role');

        $dbh = $this->_getReadAdapter();

        $binds = array(
            'parent_id' => $user->getRoleId(),
            'user_id'   => $user->getUserId(),
        );

        $select = $dbh->select()->from($roleTable)
            ->where('parent_id = :parent_id')
            ->where('user_id = :user_id');

        return $dbh->fetchCol($select, $binds);
    } else {
        return array();
    }
}
```

If there's a slight delay in replicating the previous `DELETE` statement from the master to the slave, the record may still exist when this check is run, causing it to get deleted, but never re-added.

Again, the solution is fairly simple, filter `$oldRoleUsers` and `$roleUsers` to remove any duplicates...

```php
$originalOldRuleUsers = $oldRoleUsers;
$originalRoleUsers = $roleUsers;
$oldRoleUsers = array_diff($originalOldRoleUsers, $originalNewRoleUsers);
$roleUsers = array_diff($originalNewRoleUsers, $originalOldRoleUsers);
```