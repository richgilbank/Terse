(function() {
  var util = require('./util'),
      Promise = require('bluebird'),
      rp = require('request-promise'),
      fs = require('fs'),
      path = require('path'),
      _ = require('lodash');

  Promise.promisifyAll(fs);

  var File = function(opts) {
    for(var i in opts) {
      this[i] = opts[i];
    }
  }

  File.prototype = {};

  File.read = function(filePath) {
    if(util.isLocal(filePath) && fs.existsSync(filePath)) {
      return fs.readFileAsync(filePath, 'utf8').then(function(content) {
        return {
          name: util.fileName(filePath),
          content: content
        };
      });
    }
    else if(!util.isLocal(filePath)) {
      return rp(filePath).then(function(content) {
        return {
          name: util.fileName(filePath),
          content: content
        };
      });
    }
    else {
      throw new Error('File does not exist: ' + filePath);
    }
  }

  File.readAll = function(paths) {
    return Promise.map(_.uniq(paths), File.read);
  }

  module.exports = File;
})();
