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
          var cssFile = results.join('');
          var processed = processCss(cssFile);
          var aliases = createAliases(processed);
          writeOutFiles({
            files: [file],
            aliases: aliases,
            css: cssFile
          });
        });

      });
    });

  }

  function replaceCssSelectors(body, aliases) {
    for(var c in aliases.classes) {
      body = body.replace('.' + c, '.' + aliases.classes[c]);
    }
    for(var i in aliases.ids) {
      body = body.replace('#' + i, '#' + aliases.ids[i]);
    }

    return body;
  }

  function writeOutFiles(params) {
    var cssOut = replaceCssSelectors(params.css, params.aliases);
    fs.writeFile(path.join(process.cwd(), '_styles.css'), cssOut);
  }

  module.exports = terse;
})();
