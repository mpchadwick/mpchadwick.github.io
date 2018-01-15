---
layout: blog-single
title:  Checking If An Array Is Empty In Ruby
description: A review of the many ways available to check if an array is empty in Ruby
date: December 03, 2017
image: 
tags: [Ruby]
---

Recently, I was working on some Ruby code where I had to check if an array is empty. It turns out there are many ways to skin this cat. Here I'll document my learnings...

<!-- excerpt_separator -->

### Evaluating The Array As A Boolean

As a developer mainly working in PHP my first instinct was simply to evaluate the array as a boolean (empty arrays are false-y in PHP). However I quickly learned that similar to JavaScript, empty arrays are truth-y in Ruby...

```ruby
irb(main):001:0> !![]
=> true
```

As such, doing something like this won't work...

```ruby
if some_array
  do_something
  # More code...
end
```

### Checking The Length Of The Array

One option that *does* work is to check the length of the array...

```ruby
irb(main):001:0> [].length
=> 0
irb(main):002:0> [1].length
=> 1
irb(main):003:0> [1, 'foo'].length
=> 2
```

As such the following *will* work if you want to do something if the array has elements...

```ruby
if some_array.length > 0
  do_something
  # More code..
end
```

This is how one would typically check this in JavaScript.

### Avoiding Code Smells

On a pull request I was working on I started out checking the length, however when I ran Rubocop I saw it didn't like that...

```
$ rubocop
Inspecting 1 file
C

Offenses:

test.rb:2:4: C: Use !empty? instead of length > 0.
if some_array.length > 0
   ^^^^^^^^^^^^^^^^^^^^^
```

Aha! So a cleaner approach is call the `empty?` method on the array...

```ruby
irb(main):001:0> [].empty?
=> true
irb(main):002:0> ['foo'].empty?
=> false
```

Now we can rewrite our code as...

```ruby
if !some_array.empty?
  do_something
  # More code
end
```

### Avoiding Code Smells - Take 2

Rubocop is still not happy...

```
$ rubocop
Inspecting 1 file
C

Offenses:

test.rb:2:1: C: Favor unless over if for negative conditions.
if !some_array.empty? ...
^^^^^^^^^^^^^^^^^^^^^
```

It would like us to switch from `if !` to `unless`. In my use case, however, `unless` wouldn't work because I was checking two conditions.

```ruby
if some_condition && !some_array.empty?
  do_something
  # More code
end
```

However another alternative, I subsequently learned is to use `any?`

```ruby
if some_condition && some_array.any?
  do_something
  # More code
end
```

### Gotchas with `any?` vs `!empty?`

One important thing to note about `any?` is documented in the Stack Overflow questions ["Check for array not empty: any?"](https://stackoverflow.com/a/6245946/2877224)

`any?` will return `false` array that contains only `nil` elements...

```
irb(main):009:0> [nil].any?
=> false
```

However `!empty?` will return true...

```
irb(main):011:0> ![nil].empty?
=> true
``` 
