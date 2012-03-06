
define('specs/account', ['account'], function(Account) {
  var app_mock;
  app_mock = (function() {

    function app_mock() {}

    app_mock.prototype.couchDB_url = 'http://my.cou.ch';

    app_mock.prototype.trigger = function() {};

    return app_mock;

  })();
  return describe("couchApp", function() {
    beforeEach(function() {
      this.app = new app_mock;
      this.account = new Account(this.app);
      spyOn($, "ajax").andReturn($.Deferred());
      return spyOn(this.app, "trigger");
    });
    describe(".sign_up(email, password)", function() {
      beforeEach(function() {
        this.account.sign_up('joe@example.com', 'secret');
        this.args = $.ajax.mostRecentCall.args[0];
        return this.data = JSON.parse(this.args.data);
      });
      it("should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", function() {
        expect($.ajax).wasCalled();
        expect(this.args.type).toBe('PUT');
        return expect(this.args.url).toBe('http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com');
      });
      it("should set Content-Type to application/json", function() {
        return expect(this.args.contentType).toBe('application/json');
      });
      it("should have set _id to 'org.couchdb.user:joe@example.com'", function() {
        return expect(this.data._id).toBe('org.couchdb.user:joe@example.com');
      });
      it("should have set name to 'joe@example.com", function() {
        return expect(this.data.name).toBe('joe@example.com');
      });
      it("should have set type to 'user", function() {
        return expect(this.data.type).toBe('user');
      });
      it("should pass password", function() {
        return expect(this.data.password).toBe('secret');
      });
      return _when("sign_up successful", function() {
        beforeEach(function() {
          return $.ajax.andCallFake(function(options) {
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
        this.account.sign_in('joe@example.com', 'secret');
        this.args = $.ajax.mostRecentCall.args[0];
        return this.data = JSON.parse(this.args.data);
      });
      it("should send a POST request to http://my.cou.ch/_session", function() {
        expect($.ajax).wasCalled();
        expect(this.args.type).toBe('POST');
        return expect(this.args.url).toBe('http://my.cou.ch/_session');
      });
      it("should send email as name parameter", function() {
        return expect(this.data.name).toBe('joe@example.com');
      });
      it("should send password", function() {
        return expect(this.data.password).toBe('secret');
      });
      return _when("sign_up successful", function() {
        beforeEach(function() {
          return $.ajax.andCallFake(function(options) {
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
        this.account.sign_out();
        return this.args = $.ajax.mostRecentCall.args[0];
      });
      it("should send a DELETE request to http://my.cou.ch/_session", function() {
        expect($.ajax).wasCalled();
        expect(this.args.type).toBe('DELETE');
        return expect(this.args.url).toBe('http://my.cou.ch/_session');
      });
      return _when("sign_up successful", function() {
        beforeEach(function() {
          return $.ajax.andCallFake(function(options) {
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
