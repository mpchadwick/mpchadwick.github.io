---
layout: blog-single
title:  What You Lose When You Ignore Vendor Code
description: Ignoring vendor code is typically thought to be best practice. But it comes at a cost. Here, we explore the hidden cost to ignoring vendor code.
date: October 13, 2017
image:
tags: [Thoughts]
---

It's more or less universally accepted as best practice to ignore "vendor" code from your project's source control. 

For example, in the Ruby world, dependencies are referenced in a `Gemfile` and are then installed entirely outside of the project directory.

In the JavaScript world, they're declared in `package.json`. They then get installed in the `node_modules` directory within the project. However, that's more or less universally ignored, as we can see for example in [the `.gitignore` file of the popular NodeJS framework, Express](https://github.com/expressjs/express/blob/351396f971280ab79faddcf9782ea50f4e88358d/.gitignore#L17).

Go takes a similar approach to Ruby, installing dependencies in the `src/` folder of your `$GOPATH`, outside of the project directory.

I primarily work with the Magento platform where ignoring vendor code is a relatively new concept, with the advent of Magento 2. Previously, code was installed into the `app/code` directory in the `local` or `community` code pool which typically **was** committed (although not by all).

While ignoring vendor code is by and large a good thing, there are a few things that you lose out on in doing so. Here I'll outline the issues I've run into.

<!-- excerpt_separator -->

### Debugging Vendor Code Locally

Vendor code doesn't always work like it's supposed to (or like you think it's supposed to) so sometimes you need to debug it. While a proper debugger like Xdebug is generally thought to be best practice, many developers (myself included) do a lot of their debugging by modifying code with debug statements such as `var_dump` and/or `die`.

Often times, in the course of debugging something, you wind up with many of these statements scattered across half a dozen or more files.

The challenge is, if you haven't committed this vendor code to source control how can you see which files you've changed?

The answer is, **you can't**. If the code were committed you could use `git status` to get a list of modified files and `git diff` to see the changes. You could also use `git checkout` to revert them.  With your code ignored, none of this is easy to do.

### Production Debugging Via Logging

In addition to debugging vendor code locally, occasionally you need to debug it in production. My most common strategy for that is to employ logging. Simply add a few log statements in the areas you're debugging, deploy it out to production and get the answers you're looking for. However, when the code is ignored, it's typically downloaded from the source as part of the build process on deploy. There are techniques for getting around this by applying patches after the installing from source, however it adds a bit of additional complexity to generate a patch compared to just modifying the files and committing them.

### Code Is Hidden During Code Review

Another issue with not committing the code is that it makes it much less likely that anyone will look at the code during code review. Instead, they'll just be looking at a diff of a `composer.json` and `composer.lock` file. At that point, what is there to really review anyway, right? If the entire library / plugin being added is committed it makes it easier to review and comment on the code being added.

### Vendor Code Is Not Browseable / Searchable In GitHub

Working at a software development agency, we manage the a large number of code bases across our client portfolio. It is not feasible for all our developers (myself included) to have local working copies of **all** these code bases with vendor code installed. However, it beneficial for **any** developer to be able to quickly browse vendor code to provide direction to other team mates via code reference points. Additionally, during code reviews it can be helpful to reference vendor code as "the right way of doing things". When vendor code is not committed the only way to do either of these is to browse the upstream repository, which is in the best case cumbersome, but in the worst case impossible (in the case of private repos).

### Conclusion

The point of this post is **not** to say that we shouldn't be ignor-ing `vendor/`. I **absolutely** think we should. There are **many**(!!) benefits to it that I won't touch on here. Instead, the point is to say that, like everything, there are some tradeoffs and things that you lose if you ignore vendor.

Hope you found this post interesting!

<div class="tout tout--alt">
<p><strong>December 20th, 2017</strong>: Updated to reflect an additional challenge I've been having recently with ignoring vendor code ("Vendor Code Is Not Browseable / Searchable In GitHub").</p>
</div>