
define('specs/remote', ['store', 'couchapp'], function(Store, couchApp) {
  var app_mock;
  app_mock = (function() {

    function app_mock() {}

    app_mock.prototype.uuid = function() {
      return 'abc';
    };

    app_mock.prototype.trigger = function() {};

    return app_mock;

  })();
  return describe("Remote", function() {
    return beforeEach(function() {
      this.app = new app_mock;
      return this.store = new Store(this.app);
    });
  });
});
