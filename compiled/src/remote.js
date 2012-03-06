
define('remote', ['errors'], function(ERROR) {
  'use strict';
  var Remote;
  return Remote = (function() {

    function Remote(app) {
      this.app = app;
    }

    Remote.prototype.listen_to_changes = function() {};

    Remote.prototype.push_changes = function() {};

    return Remote;

  })();
});
