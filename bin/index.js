#!/usr/bin/env node

var terse = require('../lib/terse.js'),
    program = require('commander'),
    fs = require('fs'),
    pkg = require('../package.json');

program
  .version(pkg.version)
  .usage('[options] <HTML file paths>')
  .option('-c, --css-filename <value>', 'Output filename for the CSS', 'styles.trs.css')
  .option('-d, --destination <value>', 'Destination directory for output', process.cwd())
  .parse(process.argv);

if(!program.args.length) {
  program.help();
}

var files = program.args;
var options = {
  cssFilename: program.cssFilename,
  destination: program.destination
};

terse(files, options, function(output) {
  console.log(output);
});
