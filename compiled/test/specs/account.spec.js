
define('specs/account', ['account'], function(Account) {
  var app_mock;
  app_mock = (function() {

    function app_mock() {}

    app_mock.prototype.couchDB_url = 'http://my.cou.ch';

    app_mock.prototype.trigger = function() {};

    app_mock.prototype.request = function() {};

    return app_mock;

  })();
  return describe("couchApp", function() {
    beforeEach(function() {
      this.app = new app_mock;
      this.account = new Account(this.app);
      spyOn(this.app, "request");
      return spyOn(this.app, "trigger");
    });
    describe(".sign_up(email, password)", function() {
      beforeEach(function() {
        var _ref;
        this.account.sign_up('joe@example.com', 'secret');
        return _ref = this.app.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", function() {
        expect(this.app.request).wasCalled();
        expect(this.type).toBe('PUT');
        return expect(this.path).toBe('/_users/org.couchdb.user%3Ajoe%40example.com');
      });
      it("should have set _id to 'org.couchdb.user:joe@example.com'", function() {
        return expect(this.options.data._id).toBe('org.couchdb.user:joe@example.com');
      });
      it("should have set name to 'joe@example.com", function() {
        return expect(this.options.data.name).toBe('joe@example.com');
      });
      it("should have set type to 'user", function() {
        return expect(this.options.data.type).toBe('user');
      });
      it("should pass password", function() {
        return expect(this.options.data.password).toBe('secret');
      });
      return _when("sign_up successful", function() {
        beforeEach(function() {
          return this.app.request.andCallFake(function(type, path, options) {
            return options.success();
          });
        });
        it("should trigger `account:sign_up` event", function() {
          this.account.sign_up('joe@example.com', 'secret');
          return expect(this.app.trigger).wasCalledWith('account:sign_up');
        });
        return it("should trigger `account:sign_up` event", function() {
          this.account.sign_up('joe@example.com', 'secret');
          return expect(this.app.trigger).wasCalledWith('account:sign_in');
        });
      });
    });
    describe(".sign_in(email, password)", function() {
      beforeEach(function() {
        var _ref;
        this.account.sign_in('joe@example.com', 'secret');
        return _ref = this.app.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should send a POST request to http://my.cou.ch/_session", function() {
        expect(this.app.request).wasCalled();
        expect(this.type).toBe('POST');
        return expect(this.path).toBe('/_session');
      });
      it("should send email as name parameter", function() {
        return expect(this.options.data.name).toBe('joe@example.com');
      });
      it("should send password", function() {
        return expect(this.options.data.password).toBe('secret');
      });
      return _when("sign_up successful", function() {
        beforeEach(function() {
          return this.app.request.andCallFake(function(type, path, options) {
            return options.success();
          });
        });
        return it("should trigger `account:sign_up` event", function() {
          this.account.sign_in('joe@example.com', 'secret');
          return expect(this.app.trigger).wasCalledWith('account:sign_in');
        });
      });
    });
    describe(".change_password(email, password)", function() {
      return it("should have some specs");
    });
    return describe(".sign_out()", function() {
      beforeEach(function() {
        var _ref;
        this.account.sign_out();
        return _ref = this.app.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should send a DELETE request to http://my.cou.ch/_session", function() {
        expect(this.app.request).wasCalled();
        expect(this.type).toBe('DELETE');
        return expect(this.path).toBe('/_session');
      });
      return _when("sign_up successful", function() {
        beforeEach(function() {
          return this.app.request.andCallFake(function(type, path, options) {
            return options.success();
          });
        });
        return it("should trigger `account:sign_up` event", function() {
          this.account.sign_out('joe@example.com', 'secret');
          return expect(this.app.trigger).wasCalledWith('account:sign_out');
        });
      });
    });
  });
});
