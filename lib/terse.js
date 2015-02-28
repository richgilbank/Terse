(function() {
  'use strict';

  var path = require('path'),
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
      return selectors.concat(rule.selectors.reduce(function(prev, selector) {
        var matches = selector.match(/[.#]{1}[-_a-z0-9]+/gi);
        if(!matches) return prev;
        return prev.concat(matches);
      }, []));
    }, []);

    var classes = [], ids = [];
    _.flatten(eligible).forEach(function(selector) {
      var selectorName = selector.substring(1);

      if(selector.match(/\./) && !_.includes(classes, selectorName)) {
        classes.push(selectorName);
      }
      if(selector.match(/#/) && !_.includes(ids, selectorName)) {
        ids.push(selectorName);
      }
    });

    return {classes: classes, ids: ids};
  }

  function createAliases(processed) {
    var aliases = {classes: {}, ids: {}};
    var incr = 0;

    processed.classes.forEach(function(klass) {
      aliases.classes[klass] = "t" + incr;
      incr++;
    });

    processed.ids.forEach(function(id) {
      aliases.ids[id] = "t" + incr;
      incr++;
    });

    return aliases;
  }

  function terse(files, options, cb) {

    Promise.all(files.map(function(file) {
      var childArgs = [
        path.join(__dirname, 'phantom-script.js'),
        path.join(process.cwd(), file),
        500
      ];

      return new Promise(function(resolve, reject) {
        util.runPhantom(childArgs, function(err, stdout) {
          resolve({fileName: file, htmlString: stdout});
        });

      });
    })).then(function(htmlFiles) {
      var stylesheets = htmlFiles.reduce(function(prevArray, htmlFile) {
        return prevArray.concat($(htmlFile.htmlString).find('link[rel="stylesheet"]').get().map(function(el) {
          return util.normalizeCssPath(htmlFile.fileName, el.attribs.href);
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
        var aliases = createAliases( processCss(concattedString) );

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
        var htmlOut = util.updateHtmlFiles(files, aliases);

        var cssWritePromises = cssOut.map(function(dom) {
          return fs.writeFileAsync(path.join(options.destination, dom.name), dom.content);
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
