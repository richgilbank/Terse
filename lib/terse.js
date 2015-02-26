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
      return selectors.concat(rule.selectors.map(function(selector) {
        return selector.split(/[^A-z0-9-_\.#:]+/).map(function(e) {
          return e.split(':')[0];
        })
      }));
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

    files.forEach(function(file) {
      var childArgs = [
        path.join(__dirname, 'phantom-script.js'),
        path.join(process.cwd(), file),
        100
      ];

      new Promise(function(resolve, reject) {
        util.runPhantom(childArgs, function(err, stdout) {
          resolve($(stdout));
        });

      }).then(function($htmlString) {
        var stylesheets = $htmlString.find('link[rel="stylesheet"]').get().map(function(el) {
          var root = file;
          return util.normalizeCssPath(root, el.attribs.href);
        });
        return Promise.resolve(stylesheets);

      }).then(function(stylesheets) {
        return Promise.map(stylesheets, function(stylesheet) {
          if(fs.existsSync(stylesheet) && util.isLocal(stylesheet)) {
            return fs.readFileAsync(stylesheet, 'utf8');
          }
          else if(!util.isLocal(stylesheet)) {
            return rp(stylesheet);
          }
          else {
            throw new Error('File does not exist: ' + stylesheet);
          }
        });

      }).then(function(results) {
        var cssString = results.join('');
        var aliases = createAliases( processCss(cssString) );
        var cssOut = util.updateCssString(cssString, aliases)
        var htmlOut = util.updateHtmlFiles(files, aliases);

        Promise.all([
          fs.writeFileAsync(path.join(options.destination, options.cssFilename), cssOut)
        ]).catch(function(e) {
          throw new Error('Unable to write file: ' + e);
        });
      });
    });

  }

  module.exports = terse;
})();
