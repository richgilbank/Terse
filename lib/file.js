(function() {
  var util = require('./util'),
      Promise = require('bluebird'),
      fs = require('fs'),
      path = require('path'),
      _ = require('lodash'),
      request = require('request');

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
      return new Promise(function(resolve, reject) {
        request(filePath, function(error, response, body) {
          if(error) throw new Error('Unable to fetch ' + filePath);
          resolve(body, response);
        });
      }).then(function(content, response) {
        return {
          name: util.fileName(filePath),
          content: content,
          originalSize: response.headers['content-length']
        }
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
