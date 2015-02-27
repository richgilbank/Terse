# Terse

### What is Terse? 
Terse is a node.js command line tool for obfuscating classes and IDs in HTML and CSS.

### What's it do?
Once provided with an HTML file (or multiple), it will load them up in PhantomJS, find all the stylesheets in the page (including ones injected with JS), and parse them to find all the class names and IDs. It then aliases each of those identifiers and saves a copy of the HTML file with the DOM modified to show these new identifiers, as well as a concatenated copy of the CSS, with the selectors shortened. 

### TL;DR
In CSS, `.my-awesome-module .my-awesome-module__child-with-stuff {...}` would become something like `.t0 .t1 {...}`.

### Why? 
Many people, myself included, have taken to writing CSS in [BEM](http://csswizardry.com/2013/01/mindbemding-getting-your-head-round-bem-syntax/) syntax (or something similar), which I've found can become quite verbose at times. For development speed and readability, this is a huge win. For files being shipped over the wire, not so much. Terse can be added as a build step to your workflow, allowing you to write CSS in a familiar way, without sacrificing page performance. 

### Usage
To install Terse globally, run `npm install -g`. 
```
Usage: terse [options] <HTML paths>
Options:
  -h, --help                  output usage information
  -V, --version               output the version number
  -c, --css-filename <value>  Output filename for the CSS
  -d, --destination <value>   Destination directory for output
```
