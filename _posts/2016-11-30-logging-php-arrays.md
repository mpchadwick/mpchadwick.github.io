---
layout: blog-single
title: Logging PHP Arrays
description: Or, why print_r is the _wrong_ way to log an array.
date: November 30, 2016
image:
tags: [PHP, Sysadmin, Debugging]
ad: domain-clamp-ad-b.html
has_tweet: true
---

> How should I log a PHP array?

If you work as a PHP developer this is probably a question you've asked yourself before. There are quite a few guides you'll find online in regards to this subject.

- [How to print array contents in log file](http://magento.stackexchange.com/questions/8675/how-to-print-array-contents-in-log-file)
- [Using `error_log` with `print_r` to gracefully debug PHP](http://www.openmutual.org/2012/01/using-error_log-with-print_r-to-gracefully-debug-php/)
- [Logging an Array in Laravel](http://www.easylaravelbook.com/blog/2015/09/04/logging-an-array-in-laravel/)

Typically, they point to PHP's `print_r` function.

<img
  class="rounded shadow"
  src="/img/blog/log-php-array/php-log-array-google-search-b@1x.jpg"
  srcset="/img/blog/log-php-array/php-log-array-google-search-b@1x.jpg 1x, /img/blog/log-php-array/php-log-array-google-search-b@2x.jpg 2x"
  alt="Log PHP Array Google Search Results">

Unfortunately, they're wrong :open_mouth:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">PSA: print_r() for logs sucks...</p>&mdash; Max Chadwick (@maxpchadwick) <a href="https://twitter.com/maxpchadwick/status/803992503930286081">November 30, 2016</a></blockquote>

So why, exactly, does `print_r` suck for logging? Allow me to elaborate.

<!-- excerpt_separator -->

### `print_r`'s Stated Purpose

Here's the description of the `print_r` function pulled from [the PHP documentation](http://php.net/manual/en/function.print-r.php).

> Prints human-readable information about a variable

Sounds like what we're looking for when logging an array, right?

**Wrong**. The key problem is that `print_r` is intended to display an array in a **human-readable** format. And that, my friends, is where the trouble starts.

### Who Actually Reads Log Files?

Contrary to popular belief, raw log files are not typically read by humans. Rather, a machine is generally used to process raw log files to assist in answering questions asked by humans.

Here's an example.

> *Client*: We  are getting reports from good customers that payments are being rejected.

This is a real world example that I was literally just asked to investigate today. In this case, I was working with the Magento platform, which, when put into "debug" mode, [logs the requests and responses it makes to the payment gateway using `print_r`](https://github.com/OpenMage/magento-mirror/blob/magento-1.9/app/Mage.php#L838-L842) :anguished:

The log files look something like...

```
2016-11-30T20:45:59+00:00 DEBUG (7): Array
(
    [request] => Array
        (
            [amt] => 46.13
            [acct] => ****
            [expdate] => ****
            [cvv2] => ****
            [currency] => USD
            [firstname] => Bob
            [lastname] => Smith
            [street] => 123 Main St
            [city] => New York
            [state] => NY
            [zip] => 12345
            [country] => US
            [email] => bob@example.com
        )

    [result] => Array
        (
            [result] => 125
            [respmsg] => Declined by Fraud Service
            [authcode] => 111111
            [avsaddr] => N
            [avszip] => N
            [cvv2match] => Y
            [procavs] => N
            [proccvv2] => M
            [iavs] => N
            [prefpsmsg] => No Rules Triggered
            [postfpsmsg] => Reject AVS
            [result_code] => 125
        )
)
```

Here are the questions I'd hope this log file can help me answer...

- Is there *really* an increase in orders being rejected?
- If so, how bad? 
- Are there any patterns that might indicate why this is happening?

The fact that the logs are human-readable is nice if I just want to review one case. But reviewing trends over days, weeks, or months, is not something I would want to manually do.

### How To Analyze A Log File With A Machine

My top commands when looking at log files are the following

- [`grep`](https://linux.die.net/man/1/grep)
- [`awk`](https://linux.die.net/man/1/awk)
- [`sort`](https://linux.die.net/man/1/sort)
- [`uniq -c`](https://linux.die.net/man/1/uniq)

The thing is, usage of this tool set is much easier if each entry in the log file is on one line (the way that Apache and Nginx do logging, for example). Here's a command I might use to look for an increase in 503 errors over a period of time.

```
$ sudo tail -n 99999 /var/log/httpd/access.log \
    | grep ' 503 ' \  
    | awk '{ print $4 }' \
    | awk -F":" '{ print $1 }' \
    | sort \
    | uniq -c
```

That might print something like this...

```
     3 [27/Nov/2016
    5 [28/Nov/2016
     11 [29/Nov/2016
    179 [30/Nov/2016
```    

179 503s on Nov 30th whereas there were less than 20 the past few days? Houston we have a problem.

With the payment debug logs I'd really just like to `grep` for "Declined by Fraud Service", but unfortunately, I can't **easily** extract any other details about these results (e.g. date) because they're on a separate lines. `grep` offers `-A` and `-B` flags to grab some surrounding context, but `print_r` results are typically variable height so those flags don't really help. Believe me, I've been down this path before.

Typically, if I want to work with these log files I wind up having to abandon pure bash and writing a little script in PHP to process the files.

### `json_encode` To The Rescue!

Fortunately, in PHP we can output an array to a log file all on a single line using [`json_encode`](http://php.net/manual/en/function.json-encode.php).

Now that same file will now look like this...

```json
2016-11-30T20:45:59+00:00 {"request":{"amt":"46.13","acct":"****","expdate":"****","cvv2":"****","currency":"USD","firstname":"Bob","lastname":"Smith","street":"123 Main St","city":"New York","state":"NY","zip":"12345","country":"US","email":"bob@example.com"},"result":{"result":"125","respmsg":"Declined by Fraud Service","authcode":"111111","avsaddr":"N","avszip":"N","cvv2match":"Y","procavs":"N","proccvv2":"M","iavs":"N","prefpsmsg":"No Rules Triggered","postfpsmsg":"Reject AVS","result_code":"125"}}
```
{:.wrap}

Now I can `grep` and `awk` and get the answers I want easily.

```
$ grep 'Declined' payment_file.log \
    | awk '{ print $1 }' \
    | awk -F"T" '{ print $1 }' \
    | sort \
    | uniq -c
```

### Outside of PHP-world, no one knows about `print_r` format

Another problem with `print_r` is that it's just a format that PHP made up to make arrays readable. This means that other tools that are language agnostic almost certainly don't know about `print_r` format. A perfect example of this is [Logstash](https://www.elastic.co/guide/en/logstash/current/index.html), which features a [`json` filter](https://www.elastic.co/guide/en/logstash/current/plugins-filters-json.html) for processing log files (so that they can, e.g. be shipped to [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)). `print_r` format, needless to say, is not supported.

### Conclusion

The bottom line is, `print_r` really isn't a good choice for logging arrays. I hope that this article helped show you why. If you have any comments, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
