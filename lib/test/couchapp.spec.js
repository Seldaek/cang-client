(function() {

  describe("couchApp", function() {
    return it("should be the Dev's best friend", function() {
      return expect(couchApp.best_friend).toBe('Dev');
    });
  });

}).call(this);
