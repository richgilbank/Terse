var path = require('path'),
    phantomjs = require('phantomjs'),
    childProcess = require('child_process'),
    Promise = require('bluebird'),
    fs = require('fs'),
    url = require('url'),
    cheerio = require('cheerio');

var util = {};

util.normalizeCssPath = function(root, cssPath) {
  // CSS Path is absolute
  if(!util.isLocal(cssPath) || (!util.isLocal(root) && util.isLocal(cssPath))) {
    return url.resolve(root, cssPath);
    throw new Error("I don't know what to do with the path " + cssPath);
  }
  return path.resolve(path.dirname(root), cssPath);
}

util.normalizeHtmlPath = function(file) {
  return util.isLocal(file) ? path.resolve(file) : file;
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

util.fileName = function(filePath) {
  return path.basename(filePath).split('?')[0];
}

util.updateCssStrings = function(stylesheets, aliases) {
  return stylesheets.map(function(stylesheet) {
    stylesheet.content = util.updateCssString(stylesheet.content, aliases);
    return stylesheet;
  });
}

util.updateCssString = function(body, aliases) {
  for(var c in aliases.classes) {
    body = body.replace(new RegExp('\\.'+c+'((?= +)|(?![-_a-z0-9]))', 'gi'), '.' + aliases.classes[c]);
  }
  for(var i in aliases.ids) {
    body = body.replace(new RegExp('#'+i+'((?= +)|(?![-_a-z0-9]))', 'gi'), '#' + aliases.ids[i]);
  }

  return body;
}

util.updateHtmlFiles = function(files, aliases) {
  return files.map(function(file) {
    return {
      name: util.fileName(file.name),
      content: util.updateHtmlFile(file.content, aliases)
    };
  });
}

util.updateHtmlFile = function(body, aliases) {
  var $ = cheerio.load(body)

  Object.keys(aliases.classes).forEach(function(i) {
    $('.' + i).removeClass(i).addClass(aliases.classes[i]);
  });
  Object.keys(aliases.ids).forEach(function(i) {
    $('#' + i).attr('id', aliases.ids[i]);
  });

  return $.html();
}

module.exports = util;
