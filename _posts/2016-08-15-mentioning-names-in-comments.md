---
layout: blog-single
title: Mentioning People (by Name) in Comments
description: A rant in which I consider the merits (and downfalls) of mentioning people, by name, in source code comments
date: August 15, 2016
tags: [thoughts]
---

When commenting code, the most important thing to do is explain *why* the code exists. Anyone can figure out *what* the code does, but, other than the individuals involved in the decision that lead to the implementation, no one else will know the reason. 

<!-- excerpt_separator -->

Let me give you a concrete example. We disabled session reads for bots on a project I work on at Something Digital. We did this as we found, in New Relic, that lock contention was leading many requests with degraded response time (for bots). We did this by extending the parent session class and customizing the `read` method. The code is pretty simple to understand. Without any comments it looks like this...

```php
<?php

class SomethingDigital_RedisSession_Model_Session extends Cm_RedisSession_Model_Session
{
    public function read($sessionId)
    {
        if ($this->_isBotToSkip()) {
            return false;
        }
        return parent::read($sessionId);
    }

    protected function _isBotToSkip()
    {
        if (!$input = Mage::getStoreConfig('web/session/bot_ua_strings')) {
            return false;
        }
        $pattern = '/' . $input . '/i';
        return preg_match($pattern, $_SERVER['HTTP_USER_AGENT']);
    }
}
```

One way to go about commenting this class is as follows...

```php
<?php

class SomethingDigital_RedisSession_Model_Session extends Cm_RedisSession_Model_Session
{
    /**
     * Read the session.
     *
     * If it is a bot, we skip it.
     *
     * @param  string $sessionId
     * @return string|bool
     */
    public function read($sessionId)
    {
        if ($this->_isBotToSkip()) {
            return false;
        }
        return parent::read($sessionId);
    }

    /**
     * Is it a bot?
     *
     * @return boolean
     */
    protected function _isBotToSkip()
    {
        if (!$input = Mage::getStoreConfig('web/session/bot_ua_strings')) {
            return false;
        }
        $pattern = '/' . $input . '/i';
        return preg_match($pattern, $_SERVER['HTTP_USER_AGENT']);
    }
}
```

This tells us what the code does, but someone else looking at the code has no idea why this was actually necessary. A much better way to comment this class would be as follows...

```php
<?php

class SomethingDigital_RedisSession_Model_Session extends Cm_RedisSession_Model_Session
{
    /**
     * Read the session.
     *
     * We're overriding Cm_RedisSession_Model_Session::read() so that we can
     * skip reading the session for bots
     *
     * Upon review of Newrelic we found that requests from Googlebot were taking
     * looooong time... sometimes up to 45 seconds, and hanging on this method.
     *
     * We thought that it may have had to do with an SID in the query string
     * locking sessions, but we disabled SID through system configuration, and
     * blocked the query string in webmaster tools, then traced down individual
     * requests and found that the requests were still hanging here, even without
     * an SID in the query string
     *
     * We're not sure why Googlebot is getting hung here, but there's really no
     * reason we should try to read the session for Googlebot anyway...
     *
     * @param string $sessionId
     * @return string|bool
     */
    public function read($sessionId)
    {
        if ($this->_isBotToSkip()) {
            return false;
        }
        return parent::read($sessionId);
    }

    /**
     * Helper method to determine if request is coming from a bot we want to skip
     *
     * @return boolean
     */
    protected function _isBotToSkip()
    {
        if (!$input = Mage::getStoreConfig('web/session/bot_ua_strings')) {
            return false;
        }
        $pattern = '/' . $input . '/i';
        return preg_match($pattern, $_SERVER['HTTP_USER_AGENT']);
    }
}
```

See why this is better? Now anyone looking at this code at any time can understand *exactly* why the code exists.

Sometimes, I find it useful to put people's names in to comments.

I'll give you another example.

A client originally requested that, on the search results page, if two products get the same score (from Solr) we give a boost to the newer product (so that it'll show up first). I did some discovery on the task and came back with an implementation plan that met the requirements and an estimate.

The estimate was more than the client wanted to spend on this task (we're talking about Magento here, so nothing is as easy as it sounds), so a solution that was agreed upon was to `rsort` the result collection putting the highest product IDs (newest products) to the front of a given page of results. Not the cleanest solution, but very quick and easy.

Shortly after learning the new requirement I pushed up code that looked something like this.

```php?start_inline=1
// The highest IDs go first...

// This approach was agreed upon in a discussion with John Smith and Jane Doe as
// a quick and dirty way to sort new products to the front of search results.

// Solr firsts gives us back the results sorted by relevancy (correctly
// paged). Within the page we then resort the results to push the newest
// to the front.
rsort($ids);
```

As you'll notice, I've mentioned two people, by name, (actual names obscured, of course) in this comment.

I do this somewhat regularly. The idea here is that if someone later says "Why does search behave like this?" there is a reference in the code to the parties responsible for the decision <sup style="display: inline-block" id="a1">[1](#f1)</sup>. But I started thinking, I wonder what other's think about this practice, so I asked around at my company. Opinions ranged from...

- "I think it's a fantastic idea"
- "Spelling out names can sometimes be seen as finger pointing"
- "It can be used constructively and passive agressively"
- "It can be seen as CYA"
- "If the names are used only in objective statements there should be no issue."
- "The more documentation about a sketchy decision the better"

Wow. Lot's of great opinions.

I'm still in the camp that it's worthwhile in certain circumstances, but definitely agree that the comment needs to be worded carefully.

I think it's a really interesting conversation, though, and would be interested to hear other opinions on the matter.

### Footnote(s)

<b id="f1">1</b>. There is a little bit of defense here, so that someone doesn't later point the finger at me as the person who implemented the code thinking that I, unprompted, took a shortcut, or implemented the request via hack-y means.[↩](#a1)
