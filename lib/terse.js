(function() {
  'use strict';

  var path    = require('path'),
      css     = require('css'),
      util    = require('./util'),
      tcss    = require('./terse_css'),
      thtml   = require('./terse_html'),
      fs      = require('fs'),
      Promise = require('bluebird'),
      _       = require('lodash'),
      File    = require('./file'),
      pretty  = require('prettysize');

  Promise.promisifyAll(fs);

  function terse(files, options, cb) {
    global.options = options;
    Promise.all(files.map(function(file) {
      var childArgs = [
        path.join(__dirname, 'phantom-script.js'),
        util.normalizeHtmlPath(file),
        500
      ];

      return new Promise(function(resolve, reject) {
        util.runPhantom(childArgs, function(err, stdout) {
          resolve({name: file, content: stdout});
        });

      });
    })).then(function(htmlFiles) {
      var stylesheetPaths = thtml.extractStylesheetPaths(htmlFiles);

      return File.readAll(stylesheetPaths).then(function(stylesheets) {
        var concattedStylesheet = _.pluck(stylesheets, 'content').join('');
        tcss.extractSelectors(concattedStylesheet);
        var aliases = tcss.createAliases( tcss.extractSelectorNames(concattedStylesheet) );

        if(options.concat) {
          // Concatenate the output
          var cssOut = util.updateCssStrings([{
            name: options.concat,
            content: concattedStylesheet
          }], aliases);
        }
        else {
          var cssOut = util.updateCssStrings(stylesheets, aliases);
        }
        var htmlOut = util.updateHtmlFiles(htmlFiles, aliases);

        var cssWritePromises = cssOut.map(function(stylesheet) {
          stylesheet.filePath = path.join(options.destination, stylesheet.name);
          return fs.writeFileAsync(stylesheet.filePath, stylesheet.content);
        });
        var htmlWritePromises = htmlOut.map(function(dom) {
          return fs.writeFileAsync(path.join(options.destination, dom.name), dom.content);
        });

        Promise.all(cssWritePromises.concat(htmlWritePromises)).then(function(status) {
          if(options.verbose) {
            var beforeSize = _.chain(stylesheets).pluck('originalSize').sum().value();
            var afterSize = _.chain(stylesheets).map(function(stylesheet) {
              return fs.statSync(stylesheet.filePath).size;
            }).sum().value();
            console.log("Stylesheet size before Terse: " + pretty(beforeSize));
            console.log("Stylesheet size after Terse: " + pretty(afterSize));
            console.log("Savings: " + Math.round(100 - (afterSize / beforeSize * 100)) + "%");
          }
          return Promise.resolve(status);
        }).catch(function(e) {
          throw new Error('Unable to write file: ' + e);
        });
      });
    });

  }

  module.exports = terse;
})();
