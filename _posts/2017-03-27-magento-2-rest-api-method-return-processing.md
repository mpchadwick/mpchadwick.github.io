---
layout: blog-single
title: Magento 2 REST API method return processing
description: A (slightly rant-y) dive into how the Magento 2 REST API processes method returns
date: March 27, 2017
image:
tags: [Magento 2]
ad: domain-clamp-ad-b.html
---

If you're getting started with the Magento 2 REST API you'll find a good amount of [resources](http://inchoo.net/magento-2/magento-2-api/) [documenting](https://alankent.me/2015/07/24/creating-a-new-rest-web-service-in-magento-2/) [basic](http://devdocs.magento.com/guides/v2.0/rest/bk-rest.html) [usage](http://devdocs.magento.com/guides/v2.0/get-started/bk-get-started-api.html). Overall, it's a big improvement over the Magento 1 REST API, in my opinion. However, one thing that I couldn't find good information on is how Magento processes the result that your `method` returns. 

As such, I spent a while digging through the code to understand. Here I'll detail the (not exactly sane) way that Magento will process your method's return value.

<!-- excerpt_separator -->

> **NOTE:** This blog post is based on the Magento v2.1.5 code base

### How Your Method Gets Called

When you hit your REST route, the request will be handled by `Magento\Webapi\Controller\Rest`. Specifically the `processApiRequest` method will be called. In that method you'll see the following code...

```php?start_inline=1
$outputData = call_user_func_array([$service, $serviceMethodName], $inputParams);
$outputData = $this->serviceOutputProcessor->process(
    $outputData,
    $serviceClassName,
    $serviceMethodName
);
```

`call_user_func_array` calls the `method` on the `class` you've specified in the `service` for the route. The result gets stored as `$outputData`. It is then processed by `Magento\Framework\Webapi\ServiceOutputProcessor::process()`.

### How Your Method's Return Value Gets Processed

I'm going to paste the full contents of `Magento\Framework\Webapi\ServiceOutputProcessor::process()` here, including the documentation. The method is small, but the DocBlock is not...

```php?start_inline=1
/**
 * Converts the incoming data into scalar or an array of scalars format.
 *
 * If the data provided is null, then an empty array is returned.  Otherwise, if the data is an object, it is
 * assumed to be a Data Object and converted to an associative array with keys representing the properties of the
 * Data Object.
 * Nested Data Objects are also converted.  If the data provided is itself an array, then we iterate through the
 * contents and convert each piece individually.
 *
 * @param mixed $data
 * @param string $serviceClassName
 * @param string $serviceMethodName
 * @return array|int|string|bool|float Scalar or array of scalars
 */
public function process($data, $serviceClassName, $serviceMethodName)
{
    /** @var string $dataType */
    $dataType = $this->methodsMapProcessor->getMethodReturnType($serviceClassName, $serviceMethodName);
    return $this->convertValue($data, $dataType);
}
```

OK, now let's dig in...

#### If Your Method Returns NULL

Per the DocBlock an empty array is returned.

> If the data provided is null, then an empty array is returned

So far, so good.

#### If Your Methods Returns An Array

The DocBlock addresses this in the end...

> If the data provided is itself an array, then we iterate through the contents and convert each piece individually.

"Covert each piece"? What does this mean?

To understand we need to look at `Magento\Framework\Webapi\ServiceOutputProcessor::convertValue()`. Arrays are the first data type handled...

```php?start_inline
if (is_array($data)) {
    $result = [];
    $arrayElementType = substr($type, 0, -2);
    foreach ($data as $datum) {
        if (is_object($datum)) {
            $datum = $this->processDataObject(
                $this->dataObjectProcessor->buildOutputDataArray($datum, $arrayElementType)
            );
        }
        $result[] = $datum;
    }
    return $result;
} 
```

The thing I'd like to draw your attention to is that the `foreach` statement doesn't store your array keys in a variable...

```php?start_inline=1
foreach ($data as $datum)
```

And as the response is built up, they keys are simply discarded...

```php?start_inline=1
$result[] = $datum;
```

I find this behavior extremely frustrating. If your method is returning an associative array, the keys surely have meaning. I do not understand why Magento chose to handle arrays this way. You'll find [another user was similarly frustrated about this](http://magento.stackexchange.com/questions/94618/how-to-get-mixed-or-multi-array-response-in-rest-api-magento2) on Stack Exchange. Fortunately I was able to find a work around. Simply wrap your entire response in an additional outer array...

##### Before

**Code**

```php?start_inline=1
return [
    'foo' => 'bar',
    'hello' => 'world'
];
```

**Response**

```
$ curl 'http://magento-2-1-5/rest/V1/mpchadwick_helloapi/hello'
["bar","world"]
```

##### After

**Code**

```php?start_inline=1
return [
    [
        'foo' => 'bar',
        'hello' => 'world'
    ]
];
```

**Response**

```
$ curl 'http://magento-2-1-5/rest/V1/mpchadwick_helloapi/hello'
[{"foo":"bar","hello":"world"}]
```

#### If Your Methods Returns An Object

Here's what the DocBlock has to say about objects...

> If the data is an object, it is assumed to be a Data Object and converted to an associative array with keys representing the properties of the Data Object. Nested Data Objects are also converted...

Again, this isn't entirely clear, so let's look at `Magento\Framework\Webapi\ServiceOutputProcessor::convertValue()`.

```php?start_inline=1
elseif (is_object($data)) {
    return $this->processDataObject(
        $this->dataObjectProcessor->buildOutputDataArray($data, $type)
    );
}
```

Can't really tell much about what's going on here, let's take a look at `Magento\Framework\Reflection\DataObjectProcessor::buildOutputDataArray`.

> **NOTE** This is a beefy method and I've trimmed it down a lot to only focus on the parts that are relevant to this discussion...

```php?start_inline=1
/**
 * Use class reflection on given data interface to build output data array
 *
 * @param mixed $dataObject
 * @param string $dataObjectType
 * @return array
 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
 */
public function buildOutputDataArray($dataObject, $dataObjectType)
{
    $methods = $this->methodsMapProcessor->getMethodsMap($dataObjectType);
    $outputData = [];

    /** @var MethodReflection $method */
    foreach (array_keys($methods) as $methodName) {
        if (!$this->methodsMapProcessor->isMethodValidForDataField($dataObjectType, $methodName)) {
            continue;
        }
        $value = $dataObject->{$methodName}();
        $key = $this->fieldNamer->getFieldNameForMethodName($methodName);
        $outputData[$key] = $value;
    }
    return $outputData;
}
```

So we can see that it calls `getMethodsMap` on `Magento\Framework\Reflection\MethodsMap` and iterates through the result to build an array. `getMethodsMap` essentially gets all the public methods from the class. As it iterates through each method it calls `isMethodValidForDataField` on `Magento\Framework\Reflection\MethodsMap` to check if this method should be called. `isMethodValidForDataField` filters any method that requires arguments and then passes the method name to `Magento\Framework\Reflection\FieldNamer::getFieldNameForMethodName()` which filters any method that doesn't start with "is", "has" or "get".

If you remember the DocBlock had the following to say (emphasis mine).

> It is converted to an associative array with keys representing the **properties**

Not only is the DocBlock inaccurate (the keys represent the **methods**, not the properties), but I find these mechanics of handling object return types problematic.

This issue is that this requires you to define a `getter` method for each "property" you'd like your object to return. This leads to tons of boilerplate getters / and setters and, for an API response of any respectable size, you wind up with an extremely bloated interface / implementation combo. 

A much better approach, in my opinion, would just be to iterate through all the internal `$_data` on the object (which descends from `Magento\Framework\Api\AbstractSimpleObject`), or simply call `__toArray`.

#### If Your Method Returns A Scalar

This case is not covered in the DocBlock, but we can see it is the last case handled by `Magento\Framework\Webapi\ServiceOutputProcessor::convertValue()`.

```php?start_inline=1
else {
    /** No processing is required for scalar types */
    return $data;
}
```

In this case the data is not processed at all and is returned as is. Easy peasy

### You're Complaining A lot, What Do You Suggest We Do About It?

I suggest the following...

#### For Arrays

There should be a way to keep the keys. Perhaps you could include a certain key in your array that signals this intent and Magento could handle appropriately by first checking if that key exists via `array_key_exists`.

#### For Objects

There should be a way to have your objects `$_data` processed, rather than its methods. This could either be done by setting a public property on the object, or adding a new `class` which you're object can extend.

#### For Scalars and NULL

They're fine as is.

<hr>

All in all, however, the array wrapping workaround I outlined above currently appears to be the most sane way to build your REST API response.

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
