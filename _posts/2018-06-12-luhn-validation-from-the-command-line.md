---
layout: blog-single
title:  "Luhn Validation From the Command Line"
description: My findings on how to run Luhn validation from the command line.
date: June 12, 2018
image:
tags: [Shell]
---

Today I received an alert that a credit card scanning tool had detected data that looked like a credit card number ([PAN](https://www.investopedia.com/terms/p/primary-account-number-pan.asp)) on the file system of a client's server.

Reviewing the details I found that the tool was reporting it had found what appeared to be a credit card number in an image file on the server. This gave me quite the scare as I knew that there's [a common strain of malware](https://support.hypernode.com/knowledgebase/about-the-visbot-malware/) for Magento (the platform this site was running) which steals credit card numbers and stores them in images files to be harvested by the attacker.

The tool was reporting the the credit card number started with "304428". I was able to find the match in the reported file using [exiftool](https://www.sno.phy.queensu.ca/~phil/exiftool/)...

```
$ exiftool -m 00080878182947_2.jpg | grep -o '.\{20\}304428.\{20\}'
8cca4b4231, xmp.did:304428740720681188C6DBD8EA
```

`xmp.did:`? I wasn't sure what this was, but from some quick research I learned that it was embedded [Adobe metadata ("XMP")](https://en.wikipedia.org/wiki/Extensible_Metadata_Platform).

As a quick check I did want to see if the number passed [Luhn validation](https://en.wikipedia.org/wiki/Luhn_algorithm). I didn't want to copy paste the data into an online tool for obvious reasons, so I decided to some some further research on how to run Luhn validation from the command line. Here I'll document my findings.

<!-- excerpt_separator -->

### No Built Ins!

As far as I can tell, there are no built in command on Unix systems to do this. Additionally, I checked how to do this in many common languages (Python, Ruby, PHP) and didn't see native functions for this in any of them. Time to look for alternatives.

### Using node

My system had node and npm installed, so I decided to look for an npm package to do this, knowing that there are npm packages for just about everything under the sun. Shortly thereafter I arrived at the landing page for [the luhn package](https://www.npmjs.com/package/luhn) on npmjs.org. I decided to install it...

```
$ npm install -g luhn
```

Next I started the node console and tested things out...

```
$ node
> var luhn = require("luhn");
undefined
> luhn.validate("3044287407206811")
false
>
```

Success :raised_hands: (Interestingly, though, the tool flagged this data as a credit card number, even though it didn't pass Luhn validation :thinking:)

### If You Don't Want to Use Node

If you don't have node and npm installed and don't want to go the node route there's a pure bash implementation [here](https://gist.github.com/redmcg/6444516692c7ee72d1a79e1a98ca75dc). You can add this function to your `~/.bashrc` (or  `~/.zshrc` or whatever you use) and call it as follows...

```
$ isLUHNValid 3044287407206811
```

If it passes will exit with exit code 0. Otherwise it will exit with exit code 1.


```
$ isLUHNValid 3044287407206811
$ echo $?
1
$ isLUHNValid 4111111111111111
$ echo $?
0
```