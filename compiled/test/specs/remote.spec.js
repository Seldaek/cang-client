
define('specs/remote', ['mocks/couchapp'], function(couchAppMock) {
  return describe("Remote", function() {
    return beforeEach(function() {
      this.app = new couchAppMock;
      return this.store = new Store(this.app);
    });
  });
});
