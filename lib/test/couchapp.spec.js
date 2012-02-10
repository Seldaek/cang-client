(function() {

  describe("couchApp", function() {
    beforeEach(function() {
      this.app = new couchApp('/path/to/couch');
      spyOn(this.app.store, "_getItem").andCallThrough();
      spyOn(this.app.store, "_setItem").andCallThrough();
      spyOn(this.app.store, "_removeItem").andCallThrough();
      return spyOn(this.app.store, "_clear").andCallThrough();
    });
    return describe(".store", function() {
      return describe(".save(id, type, object)", function() {
        return _when("id is '123', type is 'document', object is {name: 'test'}", function() {
          beforeEach(function() {
            var object_string, _ref;
            this.promise = this.app.store.save('123', 'document', {
              name: 'test'
            });
            _ref = this.app.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          it("should save a document with key '123'", function() {
            return expect(this.key).toBe('123');
          });
          it("should save a document with _id = '123'", function() {
            return expect(this.object._id).toBe('123');
          });
          it("should save a document with type = 'document'", function() {
            return expect(this.object.type).toBe('document');
          });
          it("should save a document with name = 'test'", function() {
            return expect(this.object.name).toBe('test');
          });
          it("should add timestamps", function() {
            var json_date_pattern;
            json_date_pattern = /\d\d\d\d\-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ/;
            expect(this.object.updated_at).toMatch(json_date_pattern);
            return expect(this.object.created_at).toMatch(json_date_pattern);
          });
          it("should return a promise", function() {
            expect(this.promise.done).toBeDefined();
            return expect(this.promise.fail).toBeDefined();
          });
          _when("successful", function() {
            return it("should call done callback", function() {
              var success;
              success = jasmine.createSpy('success');
              this.promise.done(success);
              return expect(success).wasCalled();
            });
          });
          return _when("failed", function() {
            beforeEach(function() {
              return this.app.store._setItem.andCallFake(function() {
                throw new Error("i/o error");
              });
            });
            return it("should call fail callback", function() {
              var error, promise;
              promise = this.app.store.save('123', 'document', {
                name: 'test'
              });
              error = jasmine.createSpy('error');
              promise.fail(error);
              return expect(error).wasCalled();
            });
          });
        });
      });
    });
  });

}).call(this);
