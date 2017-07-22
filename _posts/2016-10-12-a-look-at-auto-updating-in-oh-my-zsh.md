---
layout: blog-single
title: "Auto-updating software: Diving into oh-my-zsh"
description: In this post we take a look at community opinion on this question, and then I voice my own.
date: October 12, 2016
tags: [Shell, Thoughts]
---

Recently I've been working on a little side project called [pngarbage](https://github.com/mpchadwick/pngarbage). It's a command line tool for scanning webpages and identifying image bloat. The tool is written in Go which allows me to distribute a single binary with no dependencies. I'm just in the infancy of the project and plan on (ok...hope to be) adding a bunch of new features. With that in mind, one thing I've been thinking about recently is auto-updating strategies.

I spent some time thinking about tools I use daily that implement auto-updating. The first one that came to mind is [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh), one of [the most starred repos on Github](https://github.com/search?utf8=%C3%A2%C2%9C%C2%93&q=stars%3A%3E1&type=Repositories&ref=searchresults). If you've used it before you're probably pretty familiar with this screen...

<img
  class="rounded shadow"
  src="/img/blog/auto-updating/oh-my-zsh-auto-update@1x.jpg"
  srcset="/img/blog/auto-updating/oh-my-zsh-auto-update@1x.jpg 1x, /img/blog/auto-updating/oh-my-zsh-auto-update@2x.jpg 2x"
  alt="oh-my-zsh auto-update prompt">

I spent a bit of time reviewing how oh-my-zsh goes about auto-updating and thought it would be worthwhile to do a short write up of my findings.

<!-- excerpt_separator -->

### How It Works

oh-my-zsh works by `source`-ing `~/.oh-my-zsh/oh-my-zsh.sh` in `~/.zshrc`.

```bash
export ZSH=$HOME/.oh-my-zsh
source $ZSH/oh-my-zsh.sh
```

If you look at that file you'll see that the first thing it does is run `~/.oh-my-zsh/tools/check_for_upgrade.sh` (unless you've disabled auto updating).

```bash
# Check for updates on initial load...
if [ "$DISABLE_AUTO_UPDATE" != "true" ]; then
  env ZSH=$ZSH DISABLE_UPDATE_PROMPT=$DISABLE_UPDATE_PROMPT zsh -f $ZSH/tools/check_for_upgrade.sh
fi
```

`check_for_upgrade.sh` checks for the presence of a file called `~/.zsh-update`. If it is not there (e.g. the first time you launch a shell after installing oh-my-zsh) it executes `_update_zsh_update`.

```bash
if [ -f ~/.zsh-update ]
then
  # Code to execute if ~/.zsh-update is present
else
  # create the zsh file
  _update_zsh_update
fi
```

`_update_zsh_update` simply writes the current date (represented as the number of days since the [epoch](https://en.wikipedia.org/wiki/Unix_time) to the `~/.zsh-update` file.

```bash
function _update_zsh_update() {
  echo "LAST_EPOCH=$(_current_epoch)" >! ~/.zsh-update
}
```

If `~/.zsh-update` *does* exist it will be sourced which will set `LAST_EPOCH` as an environment variable. 

```bash
if [ -f ~/.zsh-update ]
then
  . ~/.zsh-update
  # Rest of the code to execute
else
  # Code to execute if ~/.zsh-update isn't present
fi
```

It then gets the current epoch and checks if the difference in days between the last epoch is greater than `$epoch_target`.

```bash
epoch_diff=$(($(_current_epoch) - $LAST_EPOCH))
if [ $epoch_diff -gt $epoch_target ]
  # Oh boy, updating time
fi
```

 `$epoch_target`  either comes from the `UPDATE_ZSH_DAYS` environment variable (intended to be set in `~/.zshrc`) or defaults to 13.

```bash
epoch_target=$UPDATE_ZSH_DAYS
if [[ -z "$epoch_target" ]]; then
  # Default to old behavior
  epoch_target=13
fi
```

If it's time for an update the next condition it checks is whether or not it should prompt you. This is, again, done by checking an environment variable (`DISABLE_UPDATE_PROMPT`).

```bash
if [ "$DISABLE_UPDATE_PROMPT" = "true" ]
then
  # No need to prompt
else
  # Need to prompt
fi
```

If the prompt is disabled or you answer the prompt with "Y" it goes ahead and auto-updates which ultimately executes a `git pull` in `~/.oh-my-zsh/tools/upgrade.sh`. 

```bash
git pull --rebase --stat origin master
```

It then updates `~/.zsh-update` to note the latest date the update happened.

If the update prompt shows up and you dismiss it with "n" it does not execute the auto-update, but still updates `~/.zsh-update` with the current date, which will defer the prompt until `$epoch_target` has elapsed again.

```bash
if [ "$DISABLE_UPDATE_PROMPT" = "true" ]
then
  _upgrade_zsh
else
  echo "[Oh My Zsh] Would you like to check for updates? [Y/n]: \c"
  read line
  if [[ "$line" == Y* ]] || [[ "$line" == y* ]] || [ -z "$line" ]; then
    _upgrade_zsh
  else
    _update_zsh_update
  fi
fi
```

### Default Behavior

By default, oh-my-zsh behaves like this...

- `DISABLE_AUTO_UPDATE` is not set to true, meaning auto-updating **will** happen
- `UPDATE_ZSH_DAYS` is not set in the default `~/.zshrc` it creates, so it defaults to 13, meaning oh-my-zsh will try to update **every 13 days**.
- `DISABLE_UPDATE_PROMPT` is not set to true in the default `~/.zshrc` it creates, meaning you **will** be prompted to confirm the update.

### My Thoughts

I chose to investigate oh-my-zsh because I feel like they got auto-updating right. Here's what I like about it...

- 13 days is a good default for `UPDATE_ZSH_DAYS`. If it happened more than that the prompt might start to feel annoying. However, one thing to consider here is how often the user interacts with the tool. Developers are likely to launch terminal everyday, so asking about upgrade every 13 days seems infrequent enough. However, for tools that are used less often this interval may need tweaking, especially if the upgrade process is time consuming (oh-my-zsh upgrades are also quick).
- Prompting is better than just doing the upgrade without the users consent
- If I want to change either of these things, or opt out of auto-updating entirely, I can do so with by setting environment variables in my `~/.zshrc` file.

I'm looking to implement a similar auto-update strategy for pngarbage. 

### Conclusion

If you have any comments on auto-updating, feel free to drop a note comments below. Of course, as always, you can reach me on [Twitter](http://twitter.com/maxpchadwick) as well.
