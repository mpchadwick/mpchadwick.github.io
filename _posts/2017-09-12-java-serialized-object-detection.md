---
layout: blog-single
title:  "Java Serialized Object Detection"
description: A look at how Java serialized objects can be detected
date: September 12, 2017
image: /img/blog/java-serialized-object-detection/java-serialized-object-hexdump.jpg
tags: [Security]
---

I'm currently working on a tool that, among other things, attempts to detect if a string represents a serialized Java object.

I spent a while trying to find the best means for doing this and ultimately found the answer to my question in the slides for [a talk titled "Deserialize My Shorts Or How I learned to Start Worrying and Hate Java Object Deserialization" by Christopher Frohoff](https://www.slideshare.net/frohoff1/deserialize-my-shorts-or-how-i-learned-to-start-worrying-and-hate-java-object-deserialization).

<!-- excerpt_separator -->

Slide 7 is titled "Java Serialized Form" and gives some high level details on the format of Java serialized objects.

Then, on slides 11 - 13 we can see the answer to our question.

Serialized Java objects will always start with the following 5 values from `java.io.ObjectStreamConstants`...

|Constant|Hex|
|---|---|
|`STREAM_MAGIC`|`aced`|
|`STREAM_VERSION`|`0005`|
|`TC_OBJECT`|`73`|
|`TC_CLASSDESC`|`72`|

In PHP, I'm doing a simple check that the hexdump starts with the expected sequence...

```php?start_inline=1
// Assumes we recieve a base64_encoded version of the object
function isSerializedJavaObject($value)
{
    $base64decoded = base64_decode($value);
    $hex = bin2hex($base64decoded);
    return strpos($hex, 'aced00057372') === 0;
}
```