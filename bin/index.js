#!/usr/bin/env node

var terse = require('../lib/terse.js'),
    program = require('commander'),
    fs = require('fs'),
    pkg = require('../package.json');

program
  .version(pkg.version)
  .usage('[options] <HTML file paths>')
  .option('-c, --concat <filename>', 'Concatenate the stylesheets into a file named <filename>')
  .option('-d, --destination <value>', 'Destination directory for output', process.cwd())
  .option('-v, --verbose', 'Show verbose output')
  .parse(process.argv);

if(!program.args.length) {
  program.help();
}

var files = program.args;
var options = {
  concat: program.concat,
  destination: program.destination,
  verbose: program.verbose
};

terse(files, options, function(output) {
  console.log(output);
});
