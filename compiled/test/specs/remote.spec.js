
define('specs/remote', ['mocks/cang'], function(CangMock) {
  return describe("Remote", function() {
    return beforeEach(function() {
      this.app = new CangMock;
      return this.store = new Store(this.app);
    });
  });
});
