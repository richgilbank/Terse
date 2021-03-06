# Terse

### What is Terse?
Terse is a node.js command line tool for obfuscating classes and IDs in HTML and CSS.

### What's it do?
Once provided with an HTML file (or multiple), it will load them up in PhantomJS, find all the stylesheets in the page (including ones injected with JS), and parse them to find all the class names and IDs. It then aliases each of those identifiers and saves a copy of the HTML file with the DOM modified to show these new identifiers, as well as a concatenated copy of the CSS, with the selectors shortened.

### TL;DR
In CSS, `.my-awesome-module .my-awesome-module__child-with-stuff {...}` would become something like `.t0 .t1 {...}`.

### Why?
Many people, myself included, have taken to writing CSS in [BEM](http://csswizardry.com/2013/01/mindbemding-getting-your-head-round-bem-syntax/) syntax (or something similar), which can become quite verbose at times. For development speed and readability, this is a huge win. For files being shipped over the wire, not so much. Terse can be added as a build step to your workflow, allowing you to write CSS in a familiar way, without sacrificing page performance.

### Numbers
Using twitter.com (unauthenticated) as a benchmark (file sizes in bytes):

##### CSS
With gzip? | Before  | After   | Savings
-----------|---------|---------|--------
No         | 602,623 | 432,103 | 28%
Yes        | 109,670 | 90,331  | 18%

##### HTML
With gzip? | Before  | After   | Savings
-----------|---------|---------|--------
No         | 58,326  | 54,138  | 7%
Yes        | 13,063  | 12,842  | 2%

### Downside
There are some pretty substantial drawbacks to Terse. The main one is (like Uncss) that classes added via JS after user interactions aren't known to it, so classes being added won't match the names of the classes in the CSS. One potential way around this would be to have a JSON file that maps an identifier to a class name (i.e. `{MAIN_NAV_DROPDOWN: '.nav__dropdown'}`), and adding it to the list of files to parse. A build step could then import that into your main JS file. 

### Usage
To install Terse globally, run `npm install -g`.
```
Usage: terse [options] <HTML paths>
Options:
  -h, --help                  output usage information
  -V, --version               output the version number
  -c, --concat <filename>     Concatenate the CSS files into <filename>
  -d, --destination <value>   Destination directory for output
```

Copyright (c) 2015 Rich Gilbank
Released under [MIT](https://github.com/richgilbank/Terse/blob/master/LICENSE)
