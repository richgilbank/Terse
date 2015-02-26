var path = require('path'),
    phantomjs = require('phantomjs'),
    childProcess = require('child_process');

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

util.runPhantom = function(childArgs, cb) {
  var page = childProcess.execFile(phantomjs.path, childArgs, function(err, stdout, stderr) {
    if(stderr) {
      throw new Error(stderr);
    }

    cb(err, stdout, stderr);
  });
}

util.updateCssString = function(body, aliases) {
  for(var c in aliases.classes) {
    body = body.replace('.' + c, '.' + aliases.classes[c]);
  }
  for(var i in aliases.ids) {
    body = body.replace('#' + i, '#' + aliases.ids[i]);
  }

  return body;
}

util.updateHtmlFiles = function(files, aliases) {
  // files.forEeach(function(file) {
  // });
}

module.exports = util;
