---
layout: blog-single
title: Building A Custom Jekyll Command Plugin
description: A guide for building custom Jekyll sub-command plugins
date: November 23, 2016
image:
tags: [jekyll, ruby]
ad: domain-clamp-ad-b.html
---

I recently built [`jekyll-migrate-permalink`](https://github.com/mpchadwick/jekyll-migrate-permalink), a tool to help deal with the side effects of changing the [`permalink`](https://jekyllrb.com/docs/permalinks/) of a [Jekyll](http://jekyllrb.com/) blog. 

The plugin was spurred by my own contemplation about removing the `/blog` prefix from the URLs on this blog, an action which, at the time of writing this, I still haven't taken. If you just up and change URLs, you'll wind up with a bunch of backlinks that 404. [`jekyll-redirect-from`](https://github.com/jekyll/jekyll-redirect-from) can help with creating redirects, however it requires updating the [front matter](https://jekyllrb.com/docs/frontmatter/) on all existing posts with a `redirect_from` element referencing the old URL. Doing this manually is a lot of work, and error prone. So [`jekyll-migrate-permalink`](https://github.com/mpchadwick/jekyll-migrate-permalink) was born as an attempt to make this process less painful. 

While Ruby isn't my most comfortable language, I decided to build it as a [custom command Jekyll plugin](https://jekyllrb.com/docs/plugins/#commands) (rather than e.g. writing in PHP, which I work with every day). The benefit of writing the tool as a Jekyll plugin is that it allows access to the same primitives Jekyll uses when it compiles a site.  

In the process I hit quite a few stumbling blocks. While other types of plugins just allow you to drop an `.rb` file into a `_plugins` folder in the root of the site, with commands, your plugin needs to be turned into a Gem. Maybe I just don't know the right terms to Google, but I had a lot of trouble finding resources to help me through the process. Now that I've [released the plugin](https://github.com/mpchadwick/jekyll-migrate-permalink), I decided to publish a guide for creating a simple custom command Jekyll plugin, putting everything I learned into one place.

<!-- excerpt_separator -->

### What We'll Build

In this guide we'll build a dead simple plugin that adds a `jekyll hello` sub-command. Executing the command will simply print the word "hello" to the terminal.

### What You Need

This guide assumes you already have the following set up on your computer...

- Ruby
- Bundler
- Jekyll

### Scaffold the Gem

The `bundle` executable can be used to scaffold a Gem to you. Head to a folder where you normally store your projects and run `bundle gem jekyll-hello`. You should see something like this in your terminal (if this is you're first time you'll have to answer a few questions which will be stored as defaults in `~/.bundle/config`).

```
$ bundle gem jekyll-hello
Creating gem 'jekyll-hello'...
MIT License enabled in config
      create  jekyll-hello/Gemfile
      create  jekyll-hello/.gitignore
      create  jekyll-hello/lib/jekyll/hello.rb
      create  jekyll-hello/lib/jekyll/hello/version.rb
      create  jekyll-hello/jekyll-hello.gemspec
      create  jekyll-hello/Rakefile
      create  jekyll-hello/README.md
      create  jekyll-hello/bin/console
      create  jekyll-hello/bin/setup
      create  jekyll-hello/LICENSE.txt
      create  jekyll-hello/.travis.yml
Initializing git repo in /Users/maxchadwick/Projects/jekyll-hello
```

### The Code

Open up the new `jekyll-hello` folder in your editor. Create a new folder in `lib/jekyll` called `commands`. Inside of that folder create a file named `hello.rb`. Inside `hello.rb` add the following code...

```ruby
module Jekyll
  module Commands
    class Hello < Command
      class << self
        def init_with_program(prog)
          prog.command(:hello) do |c|
            c.action do |args, options|
              Jekyll.logger.info "Hello!"
            end
          end
        end
      end
    end
  end
end
```

You're tree should now look like this...

```
$ tree
.
├── Gemfile
├── LICENSE.txt
├── README.md
├── Rakefile
├── bin
│   ├── console
│   └── setup
├── jekyll-hello.gemspec
└── lib
    └── jekyll
        ├── commands
        │   └── hello.rb
        ├── hello
        │   └── version.rb
        └── hello.rb

5 directories, 10 files
```

### Make Sure Your Command Gets Loaded By The Gem

Next, open up `lib/jekyll/hello.rb`. At the bottom `require` the file we just created with `require "jekyll/commands/hello.rb"`. The file should now look like this...

```ruby
require "jekyll/hello/version"

module Jekyll
  module Hello
    # Your code goes here...
  end
end

require "jekyll/commands/hello.rb"
```

### Make Sure Jekyll Loads Your Plugin

Open the `Gemfile` of your Jekyll site. Specify `jekyll-hello` in the `jekyll_plugins` group. Replace "path" as needed depending on where you created your gem.

```ruby
group :jekyll_plugins do
   gem 'jekyll-hello', '0.1.0', :path => '/Users/maxchadwick/Projects/jekyll-hello'
end
```

**This part really threw me for a loop. [Turns out you MUST specify the version when working with Gems from local sources](http://stackoverflow.com/questions/5381681/in-rails-3s-bundle-install-of-local-gem-frozen-gem-keep-getting-source-do#answer-12895891).** 

### Try Out Your New Jekyll Plugin!

Now from within your jekyll project. you should be able to execute the `jekyll hello` sub-command.



```bash
$ bundle exec jekyll hello
             Hello!
```

### How It Works

The magic happens as a result of inheriting `Jekyll::Command`. If you review [the definition for that class](https://github.com/jekyll/jekyll/blob/ce67da0f80058f579630e0adcec538facd8418a8/lib/jekyll/command.rb) you'll see the following code.

```ruby
# Keep a list of subclasses of Jekyll::Command every time it's inherited
# Called automatically.
#
# base - the subclass
#
# Returns nothing
def inherited(base)
  subclasses << base
  super(base)
end
```

Basically, the `Command` class is keeping track of all it's children inside of `subclasses`. [`exe/jekyll`, the file that gets executed by the `jekyll` command](https://github.com/jekyll/jekyll/blob/ce67da0f80058f579630e0adcec538facd8418a8/exe/jekyll) is the responsible for identifying the appropriate subcommand and calling the `action`.

```ruby
Jekyll::Command.subclasses.each { |c| c.init_with_program(p) }

p.action do |args, _|
  if args.empty?
    Jekyll.logger.error "A subcommand is required."
    puts p
    abort
  else
    subcommand = args.first
    unless p.has_command? subcommand
      Jekyll.logger.abort_with "fatal: 'jekyll #{args.first}' could not" \
        " be found. You may need to install the jekyll-#{args.first} gem" \
        " or a related gem to be able to use this subcommand."
    end
  end
end
```

### Packaging It Up

A command that just prints out "Hello" to the terminal is pretty useless, but I'd imagine if you're reading this you're working on something that other people might actually want to use. In order to make your gem available on [RubyGems.org](https://rubygems.org/) you need to update `jekyll-hello.gemspec`. The one that Bundler scaffolded for you contains comments about what you need to fill in. Then use `gem build jekyll-hello.gemspec` to build your gem,

Once built, make sure you've registered for an account at [RubyGems.org](https://rubygems.org/). You'll then be able to push with `gem push jekyll-hello-0.1.0.gem` once you've entered your credentials at the prompt.

### Conclusion

I hope that this article was helped understand how to build command based Jekyll plugins. If you have any comments, feel free to drop a note comments below. I'm not a ruby expert by any means, so any corrections are appreciated as well. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick).
