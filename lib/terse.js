(function() {
  'use strict';

  var path = require('path'),
      childProcess = require('child_process'),
      phantomjs = require('phantomjs');

  function terse(files, options, cb) {
    var childArgs = [
      path.join(__dirname, 'phantom-script.js'),
      path.join(process.cwd(), files[0]),
      100
    ];

    var page = childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
      cb(stdout);
    });
  }

  module.exports = terse;
})();
