(function() {
  'use strict';

  var path = require('path'),
      childProcess = require('child_process'),
      phantomjs = require('phantomjs'),
      css = require('css'),
      util = require('./util'),
      fs = require('fs'),
      rp = require('request-promise'),
      Promise = require('bluebird'),
      _ = require('lodash'),
      $ = require('cheerio');

  Promise.promisifyAll(fs);

  function processCss(cssString) {
    var parsed = css.parse(cssString);

    // Remove element selectors
    var eligible = parsed.stylesheet.rules.reduce(function(selectors, rule) {
      // TODO: add media query support
      if(rule.type !== 'rule') return selectors;
      return selectors.concat(rule.selectors.map(function(selector) {
        return selector.split(/[^A-z0-9-_\.#:]+/).map(function(e) {
          return e.split(':')[0];
        })
      }));
    }, []);

    var classes = [], ids = [];
    _.flatten(eligible).forEach(function(selector) {
      if(selector.match(/\./)) classes.push(selector);
      if(selector.match(/#/)) ids.push(selector);
    });

    console.log(classes);
  }

  function terse(files, options, cb) {

    files.forEach(function(file) {
      var childArgs = [
        path.join(__dirname, 'phantom-script.js'),
        path.join(process.cwd(), file),
        100
      ];

      var page = childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
        if(stderr) {
          throw new Error(stderr);
        }

        var $htmlString = $(stdout);

        var stylesheets = $htmlString.find('link[rel="stylesheet"]').get().map(function(el) {
          var root = file;
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
          processCss(results.join(''));
        });

      });
    });

  }

  module.exports = terse;
})();
