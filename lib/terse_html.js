var _    = require('lodash'),
    $    = require('cheerio'),
    util = require('./util');

var thtml = {};

thtml.extractStylesheetPaths = function(htmlFiles) {
  var paths = htmlFiles.reduce(function(prevArray, htmlFile) {
    return prevArray.concat($(htmlFile.content).find('link[rel="stylesheet"]').get().map(function(el) {

      var stylesheetPath = util.normalizeCssPath(htmlFile.name, el.attribs.href);
      if(options.verbose) console.log('Stylesheet found: ' + stylesheetPath);
      return stylesheetPath;

    }));
  }, []);

  return paths;
}

module.exports = thtml;
