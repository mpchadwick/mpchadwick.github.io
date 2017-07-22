---
layout: blog-single
title: Massive Magento Attributes
date: March 27, 2015
tags: [Magento, Frontend]
---

<p>Magento is <a class="inline-link" href="http://stackoverflow.com/questions/1639213/why-is-magento-so-slow">often criticized</a> for being slow. I won&#39;t lie, the first time I used Magento that was my reaction as well. But after more than a year working at a <a class="inline-link" href="http://www.somethingdigital.com/">Magento Gold Solution Partner</a> I&#39;ve learned that with the right hardware, and software, Magento can run rather smoothly...most of the time.</p>
<!-- excerpt_separator -->

<h3>Background</h3>
<p>The story starts with an issue reported by a client...</p>
<blockquote>When I try access the manufacturer attribute I get an unresponsive script error</blockquote>
<p>The screenshot looked something like this...</p>
<p><img src="{{site.url}}/img/blog/5/errorMsg@1x.png" alt="Screenshot of an unresponsive script error from Firefox"></p>
<p>So I take a look at the manufacturer attribute. It&#39;s a dropdown attribute with around 3,500 options. While I&#39;m not experiencing the unresponsive script error it&#39;s definitely sluggish. Some research is in order.</p>

<h3>What They Say On The Interwebz</h3>
<p>Some quick Googling brought me to <a class="inline-link" href="http://www.sessiondigital.de/blog/magento-timeout-saving-attribute-options-type-multiple-select-dropdown/">this blog post</a>. After reading through the post and quicky reviewing <a class="inline-link" href="https://github.com/Jarlssen/Jarlssen_FasterAttributeOptionEdit">the proposed solution</a> my initial reaction was go with the module created to handle this problem. However, after discussing with a colleague I decided to dig into the issue myself. Below are my findings.</p>

<h3>What&#39;s The Problem?</h3>
<p class="italic">Note: Below is based on investigation of the issue in 1.13.1.0. YMMV.</p>
<p>If you&#39;d like to follow along, for starters, you&#39;ll need a massive attribute for testing. You can use the following MySQL script to create said attribute...
{% highlight sql %}
########################################
# Set Up A Masssive Dropdown Attribute
########################################
 
# User defined vars
SET @num_options = 3500;
SET @attribute_code = 'massive_attribute';
SET @attribute_label = 'Massive Attribute';
SET @store_id = 0;
 
# Create new attribute
INSERT INTO `eav_attribute` (`entity_type_id`, `attribute_code`, `backend_model`, `backend_type`, `frontend_input`, `frontend_label`, `frontend_class`, `source_model`, `is_required`, `is_user_defined`, `is_unique`) 
VALUES ('4', @attribute_code, NULL, 'int', 'select', @attribute_label, NULL, 'eav/entity_attribute_source_table', '0', '1', '0');
 
SELECT @attribute_id :=`attribute_id` FROM `eav_attribute` WHERE `attribute_code`=@attribute_code;
 
INSERT INTO `catalog_eav_attribute` (`attribute_id`, `is_global`, `is_searchable`, `is_filterable`, `is_comparable`, `is_visible_on_front`, `is_html_allowed_on_front`, `is_filterable_in_search`, `used_in_product_listing`, `used_for_sort_by`, `is_configurable`, `apply_to`, `is_visible_in_advanced_search`, `is_used_for_promo_rules`, `layered_navigation_canonical`) 
VALUES (@attribute_id, '1', '0', '0', '0', '0', '1', '0', '0', '0', '0', NULL, '0', '0', '0');
 
# Add options
DROP PROCEDURE IF EXISTS mpchadwick_add_options;
DELIMITER //
CREATE PROCEDURE mpchadwick_add_options(IN num_options INT, IN attribute_id INT, IN store_id INT)
BEGIN
    DECLARE i INT;
    SET i=0;
    WHILE i &lt; num_options DO
      INSERT INTO `eav_attribute_option` (`attribute_id`, `sort_order`) VALUES (attribute_id, i);
      SELECT @option_id :=`option_id` FROM `eav_attribute_option` ORDER BY `option_id` DESC LIMIT 1;
      SET @value = CONCAT("value ", i);
      INSERT INTO `eav_attribute_option_value` (`option_id`, `store_id`, `value`) VALUES (@option_id, store_id, @value);
      SET i = i + 1;
    END WHILE;
END //
DELIMITER ;
 
CALL mpchadwick_add_options(@num_options, @attribute_id, @store_id);
{% endhighlight %}
<p>Once you have your attribute, go there in Firefox. The issue was reported in Firefox and I actually found the Firefox developer tools (not Firebug) to be extremely useful for debugging this issue. Go head and pop open Firefox developer tools and open the "Performance" tab. Click record and then back in your browser click into "Massive Attribute" attribute. Stop the recording when the page loads. Here&#39;s what I got. Anything standing out to you here?</p>
<p><img src="{{site.url}}/img/blog/5/DevTools@1x.png" alt="Dev Tools Result" class="wh-auto"></p>
<p>One thing certainly stand out to me. 20 out of the 22 seconds required to load the page were spent on attributeOption.bindRemoveButtons. I think we&#39;re on to something!</p>

<h3>The Culprit</h3>
<p>To get started crack open app/design/adminhtml/default/default/template/catalog/product/attribute/options.phtml. That is the template responsible for this page:</p>
<p><img src="{{site.url}}/img/blog/5/adminScreen@1x.png" alt="Dev Tools Result"></p>
<p>Spend a little to and try to grok this file.</p>
<p>OK now let&#39;s break it down...</p>

<h3>Digging In</h3>
<p>At the bottom of the file, options are added to the page through the following foreach loop</p>
{% highlight php %}
<?php foreach ($this->getOptionValues() as $_value): ?>
  attributeOption.add(<?php echo $_value->toJson(); ?>);
<?php endforeach; ?>
{% endhighlight %}
<p>Here&#39;s the add method for the attributeOption object</p>
{% highlight javascript %}
add : function(data) {
  this.template = new Template(this.templateText, this.templateSyntax);
  var isNewOption = false;
  if(!data.id){
      data = {};
      data.id  = 'option_'+this.itemCount;
      isNewOption = true;
  }
  if (!data.intype)
      data.intype = optionDefaultInputType;
  Element.insert(this.table, {after: this.template.evaluate(data)});
  if (isNewOption && !this.isReadOnly) {
      this.enableNewOptionDeleteButton(data.id);
  }
  this.bindRemoveButtons();
  this.itemCount++;
  this.totalItems++;
  this.updateItemsCountField();
}
{% endhighlight %}
<p>So bind bindRemoveButtons is getting called each time an option is added. Let&#39;s take a look a bindRemoveButtons...</p>
{% highlight javascript %}
bindRemoveButtons : function(){
  var buttons = $$('.delete-option');
  for(var i=0;i&lt;buttons.length;i++){
      if(!$(buttons[i]).binded){
          $(buttons[i]).binded = true;
          Event.observe(buttons[i], 'click', this.remove.bind(this));
      }
  }
}
{% endhighlight %}
<p>And there&#39;s the glaring inefficiency.</p> 
<p>bindRemoveButtons is checking every single remove button element on the page each time a new option is added rather than just checking the new option that was added. With 3,500 you could see how this could add some overhead head!</p>
<p>No offense Magento, but this reads like it was written by a backend developer who couldn&#39;t figure out JavaScript and called it a day once he/she got this working.</p>
<p>OK, now that we have a better idea what&#39;s going on let&#39;s blow this popsicle stand.</p>

<h3>The Solution</h3>
<p>Obviously first and foremost the JavaScript on this page needs to be refactored. From a basic standpoint, Tsvetan&#39;s solution makes sense. Let&#39;s rewrite the block and then tweak the template. However I think we can keep things a lot more simple than what Tsvetan has done in his refactored template file.</p> 
<p>The easiest solution is to take bindRemoveButtons out of the add method and then call it once after all remove buttons have been added to the page. Let&#39;s try that and check the performance tab again in Firefox. Here&#39;s what I got...</p>
<p><img src="{{site.url}}/img/blog/5/perfRound2@1x.png" alt="Performance Tab After Refactoring Magento Core Code" class="wh-auto"></p>
<p>Well would you look at that! bindRemoveButtons went from taking 20 seconds to taking less than 1 second on my machine. I&#39;d say that&#39;s a pretty nice improvement.</p>

<h3>Conclusion</h3>
<p>As I said in the start, Magento can definitely whirr if tuned properly. Fortunately this is an admin only issue and won&#39;t have any customer facing impact. That being the issue impacts end users frequently enough that I&#39;m not the only one who&#39;s written about it. Looking at the <a class="inline-link" href="https://github.com/magento/magento2/blob/8b8cd0bd1a0a05882ef1bb657158e8db4ab8ad72/app/code/Magento/Catalog/view/adminhtml/templates/catalog/product/attribute/options.phtml">Magento 2 source code</a> it looks like this is still an issue. Until this get&#39;s patched in the Magento core (In the process of writing this I&#39;ve decided that I'd like to submit a PR) make sure to patch this template if you'd like to prevent some headaches that admins of large scale stores will run into.</p>
