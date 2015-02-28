var css = require('css')
    _   = require('lodash');

var tcss = {};

tcss.extractSelectorNames = function(content) {
  var selectors = tcss.extractSelectors(content),
      classes = [],
      ids = [];

  selectors.forEach(function(selector) {
    var selectorName = selector.substring(1);
    if(selector.match(/\./) && !_.includes(classes, selectorName))
      classes.push(selectorName);
    if(selector.match(/#/) && !_.includes(ids, selectorName))
      ids.push(selectorName);
  });

  return { classes: classes, ids: ids };
}

tcss.extractSelectors = function(content) {
  var stylesheet = css.parse(content).stylesheet;
  return tcss.extractSelectorsFromRuleset(stylesheet.rules);
}

tcss.extractSelectorsFromRuleset = function(ruleset) {
  return ruleset.reduce(function(selectors, rule) {
    if(rule.type === 'media') {
      return selectors.concat(tcss.extractSelectorsFromRuleset(rule.rules));
    }
    else if(rule.type !== 'rule') return selectors;

    return selectors.concat(rule.selectors.reduce(function(prev, selector) {
      var matches = selector.match(/[.#]{1}[-_a-z0-9]+/gi);
      if(!matches) return prev;
      return prev.concat(matches);
    }, []));
  }, []);
}

module.exports = tcss;
