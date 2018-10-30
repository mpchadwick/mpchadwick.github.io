---
layout: blog-single
title:  "Backing up Sublime Text Configuration Files without Shooting Yourself in the Foot"
description: A story of how I almost shot myself in the foot while trying to back up my Sublime Text settings
date: October 29, 2018
image:
tags: [Tools]
---

As a developer, it's common practice to backup your system settings to a remote git repository. Conventionally, these repositories are given the name ["dotfiles"](https://dotfiles.github.io/).

I've long had [such a repository](https://github.com/mpchadwick/dotfiles) containing a `~/.zshrc` file. Recently, however, I decided to backup settings for a few additional tools, including Sublime Text.

<!-- excerpt_separator -->

Guides on how to do this that you'll find online typically suggest backing up the  entire `~/Library/Application\ Support/Sublime\ Text\ 3/Packages/User` folder.

My Googling, brought me to [one such guide](https://chrisarcand.com/sublime-text-settings-and-dotfiles/) which I set out to follow.

Before committing and pushing the changes up to GitHub, I decided to take a look at the contents of the folder. To my horror I saw that the folder I was about to commit included a subfolder, `sftp_servers/` which included files with the connection details for all the servers I had setup for the [Sublime SFTP plugin](https://wbond.net/sublime_packages/sftp). **This included credentials to connect to some production instances!**<sup style="display: inline-block" id="a1">[1](#f1)</sup>.

I quickly unstaged this folder for commit and carefully reviewed its contents, committing [only the files which contained settings I cared about](https://github.com/mpchadwick/dotfiles/tree/master/sublime).

Moral of the story: Don't blindly commit the `Packages/User` folder as it may contain some sensitive information you wouldn't want to make available on a public repo.

### Footnotes

 <b id="f1">1 </b>. Yes, I know connecting my editor to a production instance is a worst practice, but in the real-world it's something that I've done before.[↩](#a1)
