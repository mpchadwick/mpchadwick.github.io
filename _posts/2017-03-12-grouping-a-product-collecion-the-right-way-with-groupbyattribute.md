---
layout: blog-single
title: GROUP-ing a product collection the right way with groupByAttribute
description:
date: March 10, 2017
image: A look at the "right" way to GROUP BY an attribute of a product collection. Works with both flat AND eav!
tags: [magento]
ad: domain-clamp-ad-b.html
---

Recently, I was reworking the implementation of a featured products widget which showed up on the home page. In order to show a variety of products we decided to `GROUP BY manufacturer`. This way only one product would show up per brand. The initial implementation looked something like this...

```php?start_inline=1
$collection = Mage::getModel('catalog/product')->getCollection();

// Do some other logic

$collection->getSelect()->group('e.manufacturer_value')
```

This was working fine in dev (and production). However, when I merged some new code into the `develop` branch and deployed it to staging I started getting exceptions. 

<!-- excerpt_separator -->

This `GROUP BY` implementation assumes that flat tables are available (`e.manufacturer_value`). However the code I merged in created an attribute through an install script making flat temporarily unavailable. 

Running a reindex would, of course, "solve" the issue, however I wanted to rework my implementation so that it could work with both flat and EAV.

After some digging I found [this StackOverflow thead](http://stackoverflow.com/questions/26014286/product-collection-group-by-attribute-value-in-magento-but-collection-count-gett) and saw `groupByAttribute` mentioned. Digging through the code I found that it will work with both flat and EAV implementations (detecting whether it is `GROUP`ing from the flat table, or a `JOIN`-ed EAV table.) `groupByAttribute` is a thing in both Magento 1 and Magento 2. It looks like this...

```php?start_inline=1
/**
 * Groups results by specified attribute
 *
 * @param string|array $attribute
 */
public function groupByAttribute($attribute)
{
    if (is_array($attribute)) {
        foreach ($attribute as $attributeItem) {
            $this->groupByAttribute($attributeItem);
        }
    } else {
        if (isset($this->_joinFields[$attribute])) {
            $this->getSelect()->group($this->_getAttributeFieldName($attribute));
            return $this;
        }

        if (isset($this->_staticFields[$attribute])) {
            $this->getSelect()->group(sprintf('e.%s', $attribute));
            return $this;
        }

        if (isset($this->_joinAttributes[$attribute])) {
            $attrInstance = $this->_joinAttributes[$attribute]['attribute'];
            $entityField = $this->_getAttributeTableAlias($attribute) . '.' . $attrInstance->getAttributeCode();
        } else {
            $attrInstance = $this->getEntity()->getAttribute($attribute);
            $entityField = 'e.' . $attribute;
        }

        if ($attrInstance->getBackend()->isStatic()) {
            $this->getSelect()->group($entityField);
        } else {
            $this->_addAttributeJoin($attribute);
            $this->getSelect()->group($this->_getAttributeTableAlias($attribute).'.value');
        }
    }

    return $this;
}
```

From now on, I'll be using `groupByAttribute` instead of `group` whenever working with any collection that descends from `Mage_Eav_Model_Entity_Collection_Abstract`.

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.