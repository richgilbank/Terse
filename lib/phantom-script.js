(function () {
  var page = require('webpage').create(),
      system = require('system');

  function evaluate() {
    var p = page.evaluate(function () {
      return document.documentElement.outerHTML;
    });

    console.log(p);
    phantom.exit();
  }

  page.open(system.args[1], function (status) {
    if (status !== 'success') {
      system.stderr.writeLine('Unable to open: ' + system.args[1]);
      phantom.exit();
    } else {
      setTimeout(evaluate, system.args[2]);
    }
  });

}());
