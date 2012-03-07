
define('specs/couchapp', ['couchapp'], function(couchApp) {
  return describe("couchApp", function() {
    beforeEach(function() {
      this.app = new couchApp('http://couch.example.com');
      return spyOn($, "ajax").andReturn($.Deferred());
    });
    describe("new", function() {
      it("should store the couchDB URL", function() {
        var app;
        app = new couchApp('http://couch.example.com');
        return expect(app.couchDB_url).toBe('http://couch.example.com');
      });
      return it("should remove trailing slash from passed URL", function() {
        var app;
        app = new couchApp('http://couch.example.com/');
        return expect(app.couchDB_url).toBe('http://couch.example.com');
      });
    });
    return describe("request(type, path, options)", function() {
      _when("request('GET', '/')", function() {
        beforeEach(function() {
          var args;
          this.app.request('GET', '/');
          return this.args = args = $.ajax.mostRecentCall.args[0];
        });
        it("should send a GET request to http://couch.example.com/", function() {
          expect(this.args.type).toBe('GET');
          return expect(this.args.url).toBe('http://couch.example.com/');
        });
        it("should set `xhrFields` to `withCredentials: true`", function() {
          return expect(this.args.xhrFields.withCredentials).toBe(true);
        });
        it("should set `crossDomain: true`", function() {
          return expect(this.args.crossDomain).toBe(true);
        });
        return it("should return a promise", function() {
          var promise;
          promise = $.Deferred();
          $.ajax.andReturn(promise);
          return expect(this.app.request('GET', '/')).toBe(promise);
        });
      });
      return _when("request('POST', '/test', {funky: 'fresh'})", function() {
        beforeEach(function() {
          var args;
          this.app.request('POST', '/test');
          return this.args = args = $.ajax.mostRecentCall.args[0];
        });
        it("should send a POST request to http://couch.example.com/test", function() {
          expect(this.args.type).toBe('POST');
          return expect(this.args.url).toBe('http://couch.example.com/test');
        });
        return it("should set `contentType: 'application/json'`", function() {
          return expect(this.args.contentType).toBe('application/json');
        });
      });
    });
  });
});
