---
layout: blog-single
title: Magento 2 REST API Response Formats
description: A dive into Magento 2's REST API implementation to understand how response format is negotiated.
date: March 28, 2017
image:
tags: [Magento 2]
ad: domain-clamp-ad-b.html
---

The Magento 2 REST API can return responses in XML or JSON format. This is done based on the `Accept` HTTP Header. Per the developer documentation..

> **HTTP headers**
> 
> `Accept`
> 
> Optional. Specifies the format of the response body. Default is JSON.
> 
> Accept: application/FORMAT
>
> Where FORMAT is either JSON or XML.
>
> If you omit this header, the response is returned in JSON format.
> 
> [http://devdocs.magento.com/guides/v2.0/get-started/gs-web-api-request.html#http-headers](http://devdocs.magento.com/guides/v2.0/get-started/gs-web-api-request.html#http-headers)


Here, I'll dive into the code, to investigate how this works...

<!-- excerpt_separator -->

### Passing The Data To The Renderer

> **NOTE:** This blog post is based on the Magento v2.1.5 code base

As mentioned in [Magento 2 REST API method return processing](/blog/magento-2-rest-api-method-return-processing), REST requests are handled by `Magento\Webapi\Controller\Rest::processApiRequest()`. To understand how the response format is negotiated, we need to start with that last line of that method...

```php?start_inline=1
$this->_response->prepareResponse($outputData);
```

`$_response` is an instance of `Magento\Framework\Webapi\Rest\Response`. We can see that `prepareResponse` passes the data to the protected `_render` method...

```php?start_inline=1
public function prepareResponse($outputData = null)
{
    $this->_render($outputData);
    if ($this->getMessages()) {
        $this->_render(['messages' => $this->getMessages()]);
    }
    return $this;
}
```

Then, `_render` passes the data to an implementation of `Magento\Framework\Webapi\Rest\Response\RendererInterface` calling the renderer's `render` method...

```php?start_inline=1
protected function _render($data)
{
    $mimeType = $this->_renderer->getMimeType();
    $body = $this->_renderer->render($data);
    $this->setMimeType($mimeType)->setBody($body);
}
```

### Resolving The Renderer

Magento resolves the renderer by calling `get` on `Magento\Framework\Webapi\Rest\Response\RendererFactory`.

```php?start_inline=1
public function __construct(
    \Magento\Framework\Webapi\Rest\Response\RendererFactory $rendererFactory,
    \Magento\Framework\Webapi\ErrorProcessor $errorProcessor,
    \Magento\Framework\App\State $appState
) {
    $this->_renderer = $rendererFactory->get();
    $this->_errorProcessor = $errorProcessor;
    $this->_appState = $appState;
}
```

`get` calls `_getRendererClass` to resolve the class name, and then uses the object manager to get an instance.

```php?start_inline=1
$renderer = $this->_objectManager->get($this->_getRendererClass());
```

`_getRendererClass` is where the logic to resolve the renderer for the response lives. Here is the entire method...

```php?start_inline=1
/**
 * Find renderer which can render response in requested format.
 *
 * @return string
 * @throws \Magento\Framework\Webapi\Exception
 */
protected function _getRendererClass()
{
    $acceptTypes = $this->_request->getAcceptTypes();
    if (!is_array($acceptTypes)) {
        $acceptTypes = [$acceptTypes];
    }
    foreach ($acceptTypes as $acceptType) {
        foreach ($this->_renders as $rendererConfig) {
            $rendererType = $rendererConfig['type'];
            if ($acceptType == $rendererType || $acceptType == current(
                explode('/', $rendererType)
            ) . '/*' || $acceptType == '*/*'
            ) {
                return $rendererConfig['model'];
            }
        }
    }
    /** If server does not have renderer for any of the accepted types it SHOULD send 406 (not acceptable). */
    throw new \Magento\Framework\Webapi\Exception(
        new Phrase(
            'Server cannot match any of the given Accept HTTP header media type(s) from the request: "%1" '.
            'with media types from the config of response renderer.',
            $acceptTypes
        ),
        0,
        \Magento\Framework\Webapi\Exception::HTTP_NOT_ACCEPTABLE
    );
}
```

The most important line is here...

```php?start_inline=1
$acceptTypes = $this->_request->getAcceptTypes();
```

From this we can assume that Magento uses the `Accept` HTTP header to resolve the appropriate renderer for the response (check `Magento\Framework\Webapi\Rest\Request::getAcceptTypes()` for the exact implementation).

In `Magento_Webapi`'s `di.xml` file we can see a list of available renderers...

```xml
<type name="Magento\Framework\Webapi\Rest\Response\RendererFactory">
    <arguments>
        <argument name="renders" xsi:type="array">
            <item name="default" xsi:type="array">
                <item name="type" xsi:type="string">*/*</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Json</item>
            </item>
            <item name="application_json" xsi:type="array">
                <item name="type" xsi:type="string">application/json</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Json</item>
            </item>
            <item name="text_xml" xsi:type="array">
                <item name="type" xsi:type="string">text/xml</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Xml</item>
            </item>
            <item name="application_xml" xsi:type="array">
                <item name="type" xsi:type="string">application/xml</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Xml</item>
            </item>
            <item name="application_xhtml_xml" xsi:type="array">
                <item name="type" xsi:type="string">application/xhtml+xml</item>
                <item name="model" xsi:type="string">Magento\Framework\Webapi\Rest\Response\Renderer\Xml</item>
            </item>
        </argument>
    </arguments>
</type>
```

As you can see, out-of-box, Magento ships with JSON and XML renderers.

### Demo

Here's a quick demo showing how the `Accept` header can be used to specify format...

##### `text/xml`

```
$ curl -H "Accept: text/xml" http://example.com/rest/V1/mpchadwick_helloapi/hello
<?xml version="1.0"?>
<response>
  <item>
    <foo>bar</foo>
    <hello>world</hello>
  </item>
</response>
```

##### `application/json`

```
$ curl -H "Accept: application/json" http://example.com/rest/V1/mpchadwick_helloapi/hello
[{"foo":"bar","hello":"world"}]
```

---

If no `Accept` header is sent, Magento will send a JSON response...

```
$ curl http://example.com/rest/V1/mpchadwick_helloapi/hello
[{"foo":"bar","hello":"world"}]
```

### Conclusion

If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
