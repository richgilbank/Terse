(function() {
  'use strict';

  var path    = require('path'),
      css     = require('css'),
      util    = require('./util'),
      tcss    = require('./terse_css'),
      fs      = require('fs'),
      rp      = require('request-promise'),
      Promise = require('bluebird'),
      _       = require('lodash'),
      $       = require('cheerio');

  Promise.promisifyAll(fs);

  function terse(files, options, cb) {
    Promise.all(files.map(function(file) {
      var htmlPath = util.isLocal(file) ? path.join(process.cwd(), file) : file;
      var childArgs = [
        path.join(__dirname, 'phantom-script.js'),
        htmlPath,
        500
      ];

      return new Promise(function(resolve, reject) {
        util.runPhantom(childArgs, function(err, stdout) {
          resolve({name: file, content: stdout});
        });

      });
    })).then(function(htmlFiles) {
      var stylesheets = htmlFiles.reduce(function(prevArray, htmlFile) {
        return prevArray.concat($(htmlFile.content).find('link[rel="stylesheet"]').get().map(function(el) {
          return util.normalizeCssPath(htmlFile.name, el.attribs.href);
        }));
      }, []);

      stylesheets.forEach(function(stylesheet) {
        console.log('Stylesheet found: ' + stylesheet);
      });

      return Promise.map(_.uniq(stylesheets), function(stylesheet) {
        if(fs.existsSync(stylesheet) && util.isLocal(stylesheet)) {
          return fs.readFileAsync(stylesheet, 'utf8').then(function(content) {
            return {
              name: util.fileName(stylesheet),
              content: content
            };
          });
        }
        else if(!util.isLocal(stylesheet)) {
          return rp(stylesheet).then(function(content) {
            return {
              name: util.fileName(stylesheet),
              content: content
            };
          });
        }
        else {
          throw new Error('File does not exist: ' + stylesheet);
        }
      }).then(function(stylesheets) {
        var concattedString = _.pluck(stylesheets, 'content').join('');
        tcss.extractSelectors(concattedString);
        var aliases = tcss.createAliases( tcss.extractSelectorNames(concattedString) );

        if(options.concat) {
          // Concatenate the output
          var cssOut = util.updateCssStrings([{
            name: options.concat,
            content: concattedString
          }], aliases);
        }
        else {
          var cssOut = util.updateCssStrings(stylesheets, aliases);
        }
        var htmlOut = util.updateHtmlFiles(htmlFiles, aliases);

        var cssWritePromises = cssOut.map(function(stylesheet) {
          return fs.writeFileAsync(path.join(options.destination, stylesheet.name), stylesheet.content);
        });
        var htmlWritePromises = htmlOut.map(function(dom) {
          return fs.writeFileAsync(path.join(options.destination, dom.name), dom.content);
        });

        Promise.all(cssWritePromises.concat(htmlWritePromises)).catch(function(e) {
          throw new Error('Unable to write file: ' + e);
        });
      });
    });

  }

  module.exports = terse;
})();
