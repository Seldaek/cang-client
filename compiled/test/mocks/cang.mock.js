
define('mocks/cang', function() {
  var CangMock, promise_mock;
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
  return CangMock = (function() {

    function CangMock() {}

    CangMock.prototype.couchDB_url = 'http://my.cou.ch';

    CangMock.prototype.trigger = function() {};

    CangMock.prototype.request = function() {};

    CangMock.prototype.on = function() {};

    CangMock.prototype.promise = function() {
      return promise_mock;
    };

    CangMock.prototype.promise_mock = promise_mock;

    CangMock.prototype.store = {
      db: {
        getItem: function() {},
        setItem: function() {},
        removeItem: function() {}
      }
    };

    return CangMock;

  })();
});
