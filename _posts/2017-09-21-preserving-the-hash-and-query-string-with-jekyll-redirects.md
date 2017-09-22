---
layout: blog-single
title:  Preserving The Hash And Query String With Jekyll Redirects
description: A look at how we can preserve the hash an query string when setting up Jekyll redirects.
date: September 21, 2017
image: 
tags: [Jekyll]
---

If you're running Jekyll on GitHub pages and looking to set up redirects, there's a good chance you stumbled upon [jekyll-redirect-from](https://github.com/jekyll/jekyll-redirect-from).
It's a nice little tool for creating redirects, simply by declaring them in a page's front matter. However, if you create a redirect using jekyll-redirect-from, there's an issue that you might be concerned about...it does not preserve the query string or hash from the original request URL when redirecting the user.

There's [an issue in the repo about this](https://github.com/jekyll/jekyll-redirect-from/issues/123) which, at the time of writing this, has been open for nearly a year. There's also [a PR to fix it](https://github.com/jekyll/jekyll-redirect-from/pull/127). However, in the interest of keeping jekyll-redirect-from simple and lightweight [it seems unlikely that this will be fixed](https://github.com/jekyll/jekyll-redirect-from/pull/127#issuecomment-330725073).

Fortunately, I've found a workaround that allows redirects on GitHub pages and preserves the query string and hash.

<!-- excerpt_separator -->

### The Workaround

The workaround is quite simple. jekyll-redirect-from operates by generating a static HTML file with a `meta` refresh tag, JavaScript, and a fallback link.

```html
<!DOCTYPE html>
<html lang="en-US">
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="http://example.com/new-page/">
  <meta http-equiv="refresh" content="0; url=http://example.com/new-page/">
  <h1>Redirecting…</h1>
  <a href="http://example.com/new-page/">Click here if you are not redirected.</a>
  <script>location="http://example.com/new-page/"</script>
</html>
```

The proposed solution for preserving the query string and hash involves adding additional JavaScript to the page to check the URL for a query string or hash and append it to the redirect URL. It also updates the `meta` refresh to wait for one second rather than zero, to allow the JavaScript to execute. The resulting HTML looks like this...

```html
<!DOCTYPE html>
<html lang="en-US">
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="http://example.com/new-page/">
  <meta http-equiv="refresh" content="0; url=http://example.com/new-page/">
  <h1>Redirecting…</h1>
  <a href="http://example.com/new-page/">Click here if you are not redirected.</a>
  <script>
    var url = 'http://example.com/new-page/';
    if (location.search && url.indexOf('?') === -1) {
      url = url.replace(/($|#)/, location.search + '$1');
    }
    if (location.hash && url.indexOf('#') === -1) {
      url += location.hash; 
    }
    location=url;
  </script>
</html>
```

The workaround is to take the HTML that _would_ be generated if [this PR](https://github.com/jekyll/jekyll-redirect-from/pull/127) were merged and simply commit it to the code base in the appropriate location. The `redirect_from` directive would also need to be removed from the front matter.

For example if we were redirecting from `/old-page` to `/new-page` instead of putting a `redirect_from` rule in `/new-page`'s front matter, we'd create `old-page.html` in the root of our repository and add the generated static HTML to redirect to `/new-page`. `old-page.html` would look like this...

```html
<!DOCTYPE html>
<html lang="en-US">
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="http://example.com/new-page/">
  <meta http-equiv="refresh" content="0; url=http://example.com/new-page/">
  <h1>Redirecting…</h1>
  <a href="http://example.com/new-page/">Click here if you are not redirected.</a>
  <script>
    var url = 'http://example.com/new-page/';
    if (location.search && url.indexOf('?') === -1) {
      url = url.replace(/($|#)/, location.search + '$1');
    }
    if (location.hash && url.indexOf('#') === -1) {
      url += location.hash; 
    }
    location=url;
  </script>
</html>
```

It's not the cleanest solution, but it gets the job done.