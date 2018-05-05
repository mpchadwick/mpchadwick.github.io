---
layout: blog-single
title:  "Password Protect Files and Folders from the Command Line with zip"
description: Instructions for password protecting files and folders from the command line using zip
date: May 04, 2018
image: /img/blog/password-protect-zip/unzipping@2x.jpg
tags: [Shell, Tools]
---

There are quite a few blog posts and StackOverflow threads covering this, but somehow, I had difficulty finding the answer I was looking for on Google. As such, I'm publishing this for my (and now your :smile:) reference...

<!-- excerpt_separator -->

### Files

To password protect a file simply run the `zip` command and supply the `-e` flag (which is short for `--encrypt`). First pass it the "destination" (e.g. file.zip) and next pass it the source (e.g. file).

```
$ zip -e file.zip file
```

Per [the `zip` man pages](https://linux.die.net/man/1/zip) you'll be prompted to input (and verify) the encryption password.

Unzipping the file will require the user to supply the encryption password you used to encrypt the zip file.

<img
  class="rounded shadow"
  src="/img/blog/password-protect-zip/unzipping@1x.jpg"
  srcset="/img/blog/password-protect-zip/unzipping@1x.jpg 1x, /img/blog/password-protect-zip/unzipping@2x.jpg 2x"
  alt="A screenshot showing the unzipping an encrypted zip file on a Mac">

It's also worth noting that if you enter the same file name for both the source **and** the destination, `zip` will automatically append `.zip` to the destination file name.

```
$ zip -e file file
```

### Folders

Password protecting folders is more or less the same, but requires supplying one additional flag to the `zip` command...the `-r` flag (short for `--recurse-paths`).

The command looks something like this...

```
$ zip -er folder.zip folder
```

Some guides you'll find suggest doing `zip -e folder.zip folder/*`, but this technique will not work if there are subfolders inside of `folder/` (e.g. `folder/subfolder`).