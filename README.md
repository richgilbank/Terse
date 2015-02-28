# Terse

### What is Terse?
Terse is a node.js command line tool for obfuscating classes and IDs in HTML and CSS.

### What's it do?
Once provided with an HTML file (or multiple), it will load them up in PhantomJS, find all the stylesheets in the page (including ones injected with JS), and parse them to find all the class names and IDs. It then aliases each of those identifiers and saves a copy of the HTML file with the DOM modified to show these new identifiers, as well as a concatenated copy of the CSS, with the selectors shortened.

### TL;DR
In CSS, `.my-awesome-module .my-awesome-module__child-with-stuff {...}` would become something like `.t0 .t1 {...}`.

### Why?
Many people, myself included, have taken to writing CSS in [BEM](http://csswizardry.com/2013/01/mindbemding-getting-your-head-round-bem-syntax/) syntax (or something similar), which can become quite verbose at times. For development speed and readability, this is a huge win. For files being shipped over the wire, not so much. Terse can be added as a build step to your workflow, allowing you to write CSS in a familiar way, without sacrificing page performance. gZipping your files seems to reduce some repetition, but I've yet to test how much it's able to work on in a stream without a comprehension of the entire file /shrug.

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
