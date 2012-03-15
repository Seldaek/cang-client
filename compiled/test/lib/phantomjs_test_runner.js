var page, waitFor;

waitFor = function(testFx, onReady, timeOutMillis) {
  var condition, f, interval, start;
  if (timeOutMillis == null) timeOutMillis = 3000;
  start = new Date().getTime();
  condition = false;
  f = function() {
    if ((new Date().getTime() - start < timeOutMillis) && !condition) {
      return condition = (typeof testFx === 'string' ? eval(testFx) : testFx());
    } else {
      if (!condition) {
        console.log("'waitFor()' timeout");
        return phantom.exit(1);
      } else {
        if (typeof onReady === 'string') {
          eval(onReady);
        } else {
          onReady();
        }
        return clearInterval(interval);
      }
    }
  };
  return interval = setInterval(f, 100);
};

if (phantom.args.length !== 1) {
  console.log('Usage: run-jasmine.coffee URL');
  phantom.exit();
}

page = new WebPage();

page.onConsoleMessage = function(msg, line, file) {
  return console.log(msg);
};

page.open(phantom.args[0], function(status) {
  if (status !== 'success') {
    console.log(status + '! Unable to access ' + phantom.args[0]);
    return phantom.exit();
  } else {
    return waitFor(function() {
      return page.evaluate(function() {
        return !window.jas.currentRunner_.queue.running;
      });
    }, function() {
      page.evaluate(function() {
        var e, el, i, list, _i, _len, _results;
        console.log('');
        console.log("================================================================================");
        console.log(document.body.querySelector('.runner .description').innerText);
        console.log("================================================================================");
        console.log('');
        list = document.body.querySelectorAll('.failed > .description, .failed > .messages > .resultMessage');
        _results = [];
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          el = list[_i];
          i = '';
          e = el;
          while (e.className !== 'jasmine_reporter') {
            e = e.parentNode;
            if (/failed/.test(e.className)) i += '  ';
          }
          if (el.className === 'resultMessage fail') i += '=> ';
          console.log(i + el.innerText);
          if (el.className === 'resultMessage fail') {
            _results.push(console.log(''));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      return phantom.exit();
    });
  }
});
