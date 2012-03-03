
define('specs/couchapp', ['couchapp'], function(couchApp) {
  return describe("couchApp", function() {
    beforeEach(function() {
      this.app = new couchApp('http://my.cou.ch');
      spyOn($, "ajax").andReturn($.Deferred());
      spyOn(this.app.store, "_getItem").andCallThrough();
      spyOn(this.app.store, "_setItem").andCallThrough();
      spyOn(this.app.store, "_removeItem").andCallThrough();
      spyOn(this.app.store, "_clear").andCallThrough();
      return this.app.store.clear();
    });
    describe(".sign_up(email, password)", function() {
      beforeEach(function() {
        this.app.sign_up('joe@example.com', 'secret');
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
      it("should have set type to 'user", function() {
        return expect(this.data.type).toBe('user');
      });
      it("should set a salt", function() {
        return expect(this.data.salt).toMatch(/[0-9a-f]{40}/);
      });
      return it("should set a password_sha hash", function() {
        expect(this.data.password_sha).toMatch(/[0-9a-f]{40}/);
        return expect(this.data.password_sha).toBe(hex_sha1('secret' + this.data.salt));
      });
    });
    describe(".sign_in(email, password)", function() {
      beforeEach(function() {
        this.app.sign_in('joe@example.com', 'secret');
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
      return it("should send password", function() {
        return expect(this.data.password).toBe('secret');
      });
    });
    describe(".change_password(email, password)", function() {
      return it("should have some specs");
    });
    return describe(".sign_out()", function() {
      beforeEach(function() {
        this.app.sign_out();
        return this.args = $.ajax.mostRecentCall.args[0];
      });
      return it("should send a DELETE request to http://my.cou.ch/_session", function() {
        expect($.ajax).wasCalled();
        expect(this.args.type).toBe('DELETE');
        return expect(this.args.url).toBe('http://my.cou.ch/_session');
      });
    });
  });
});
