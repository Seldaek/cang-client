
define('mocks/couchapp', function() {
  var couchAppMock, promise_mock;
  promise_mock = {
    reject: function() {
      return promise_mock;
    },
    resolve: function() {
      return promise_mock;
    },
    fail: function() {
      return promise_mock;
    },
    done: function() {
      return promise_mock;
    }
  };
  return couchAppMock = (function() {

    function couchAppMock() {}

    couchAppMock.prototype.couchDB_url = 'http://my.cou.ch';

    couchAppMock.prototype.trigger = function() {};

    couchAppMock.prototype.request = function() {};

    couchAppMock.prototype.on = function() {};

    couchAppMock.prototype.promise = function() {
      return promise_mock;
    };

    couchAppMock.prototype.promise_mock = promise_mock;

    couchAppMock.prototype.store = {
      db: {
        getItem: function() {},
        setItem: function() {},
        removeItem: function() {}
      }
    };

    return couchAppMock;

  })();
});
