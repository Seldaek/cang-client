
define('mocks/kang', function() {
  var KangMock, promise_mock;
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
  return KangMock = (function() {

    function KangMock() {}

    KangMock.prototype.couchDB_url = 'http://my.cou.ch';

    KangMock.prototype.trigger = function() {};

    KangMock.prototype.request = function() {};

    KangMock.prototype.on = function() {};

    KangMock.prototype.promise = function() {
      return promise_mock;
    };

    KangMock.prototype.promise_mock = promise_mock;

    KangMock.prototype.store = {
      db: {
        getItem: function() {},
        setItem: function() {},
        removeItem: function() {}
      }
    };

    return KangMock;

  })();
});
