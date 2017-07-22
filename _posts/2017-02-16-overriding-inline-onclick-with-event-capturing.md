---
layout: blog-single
title: Overriding Inline onclick Attributes With Event Capturing
description: This post reveals a method for overriding inline onclick attributes using event capturing
date: February 16, 2017
image: 
tags: [Frontend]
ad: domain-clamp-ad-b.html
---

Recently, I needed to override a `<button>`'s inline `onclick` attribute. I was writing a plugin for [Magento](https://magento.com/), which, for better or worse, makes heavy use on inline `onclick` attributes. If you run a [Google search](https://www.google.com/search?q=javascript+onclick+override) you'll see that the canonical answer looks something like this...

```javascript
document.getElementById('my-id').onclick = myOnClick;
```

For most uses cases this work fine. However, there is a caveat that should accompany this answer. **It doesn't work for elements that are dynamically added to the document.**

But never fear, there's another approach that can be used to override inline `onclick` attributes that works with dynamically added elements. And that approach, my friends, is called event capturing.

<!-- excerpt_separator -->

### Some Background 

It is worthwhile to start out with some background information about how event propagation works in JavaScript. Below is a [diagram from w3.org](https://www.w3.org/TR/2003/NOTE-DOM-Level-3-Events-20031107/events.html#Events-phases) which offers a good visual explanation.

![A diagram visually showing how event capturing and bubbling works](/img/blog/override-inline-onclick-event-capturing/eventflow.jpg)

In all modern browsers, each click event goes through two distinct phases.

##### Event capturing
 
 The event descends the document tree starting with the top most element (`document`) down to the target. The event can be captured at any step along the way, before it reaches the target. This can be done by setting the `useCapture` flag to true when registering an event listener...
 
```js
 element.addEventListener('click', (e) => {
   console.log('Hey, there');
 }, true)
```

##### Event Bubbling

After the event reaches the target it bubbles back up through all parents all the way to the top (again, `document`). If you register an event listener on the target's parent without setting `useCapture` it will be called **after** any event listener bound to the target as a result of bubbling.

### How We Can Use Event Capturing To Achieve The Desired Effect?

We can take advantage of event capturing to override inline `onclick` attributes by capturing the event in a parent element and stopping further propagation. Doing so looks something like this.

```html
<button class="button" onclick="window.location='https://www.google.com'">Hello</button>
<script>
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('button')) {
      e.stopPropagation();
      console.log('gotcha');
    }
  }, true);
</script>
```

### A Note On jQuery

It is worth noting that [jQuery provides no means for setting the `useCapture` flag on an event listener](http://stackoverflow.com/questions/24585698/capturing-and-bubbling-using-jquery#answer-24585928). In order to use this technique you need you use the vanilla JS's `addEventListener`.

### Conclusion

I hope some of you found this write up helpful. If you have any questions or comments, feel free to drop a note below, or, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
