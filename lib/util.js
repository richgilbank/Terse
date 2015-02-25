var path = require('path');

var util = {};

util.normalizeCssPath = function(root, cssPath) {

  // CSS Path is absolute
  if(!util.isLocal(cssPath)) {
    return cssPath;
  }

  var htmlPath = '';
  // HTML is in another dir (i.e. dist/index.html)
  if(root.indexOf('/') !== -1) {
    htmlPath = root.split('/').slice(0, -1).join('/');
  }
  return path.join(htmlPath, cssPath);
}

util.isLocal = function(path) {
  return path.indexOf('//') === -1;
}

module.exports = util;
