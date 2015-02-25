(function() {
  'use strict';

  var path = require('path'),
      childProcess = require('child_process'),
      phantomjs = require('phantomjs'),
      util = require('./util'),
      fs = require('fs'),
      rp = require('request-promise'),
      Promise = require('bluebird'),
      $ = require('cheerio');

  Promise.promisifyAll(fs);

  function terse(files, options, cb) {
    var childArgs = [
      path.join(__dirname, 'phantom-script.js'),
      path.join(process.cwd(), files[0]),
      100
    ];

    var page = childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
      var $htmlString = $(stdout);

      var stylesheets = $htmlString.find('link[rel="stylesheet"]').get().map(function(el) {
        var root = files[0];
        return util.normalizeCssPath(root, el.attribs.href);
      });

      Promise.map(stylesheets, function(stylesheet) {
        if(fs.existsSync(stylesheet) && util.isLocal(stylesheet)) {
          return fs.readFileAsync(stylesheet, 'utf8');
        }
        else if(!util.isLocal(stylesheet)) {
          return rp(stylesheet);
        }
        else {
          throw new Error('File does not exist: ' + stylesheet);
        }
      }).then(function(results) {
        cb(results.join(''));
      });

    });
  }

  module.exports = terse;
})();
