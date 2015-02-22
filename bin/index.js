#!/usr/bin/env node

var terse = require('../lib/terse.js'),
    program = require('commander'),
    fs = require('fs'),
    pkg = require('../package.json');

program
  .version(pkg.version)
  .usage('[options] <HTML and CSS file paths>')
  .parse(process.argv);

if(!program.args.length) {
  program.help();
}

var files = program.args;
var options = {};

terse(files, options, function(output) {
  console.log(output);
});
