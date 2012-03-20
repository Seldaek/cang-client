
define('specs/remote', ['mocks/kang'], function(KangMock) {
  return describe("Remote", function() {
    return beforeEach(function() {
      this.app = new KangMock;
      return this.store = new Store(this.app);
    });
  });
});
