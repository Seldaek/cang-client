
define('specs/couchapp', ['couchapp'], function(couchApp) {
  return describe("couchApp", function() {
    return describe("new", function() {
      it("should store the couchDB URL", function() {
        var app;
        app = new couchApp('http://example.com');
        return expect(app.couchDB_url).toBe('http://example.com');
      });
      return it("should remove trailing slash from passed URL", function() {
        var app;
        app = new couchApp('http://example.com/');
        return expect(app.couchDB_url).toBe('http://example.com');
      });
    });
  });
});
