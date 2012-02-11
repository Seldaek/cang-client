(function() {

  describe("couchApp", function() {
    beforeEach(function() {
      this.app = new couchApp('/path/to/couch');
      spyOn(this.app.store, "_getItem").andCallThrough();
      spyOn(this.app.store, "_setItem").andCallThrough();
      spyOn(this.app.store, "_removeItem").andCallThrough();
      spyOn(this.app.store, "_clear").andCallThrough();
      return this.app.store.clear();
    });
    return describe(".store", function() {
      describe(".uuid(num = 7)", function() {
        it("should default to a length of 7", function() {
          return expect(this.app.store.uuid().length).toBe(7);
        });
        return _when("called with num = 5", function() {
          return it("should generate an id with length = 5", function() {
            return expect(this.app.store.uuid(5).length).toBe(5);
          });
        });
      });
      describe(".save(type, id, object)", function() {
        it("should return a promise", function() {
          var promise;
          promise = this.app.store.save('document', '123', {
            name: 'test'
          });
          expect(promise.done).toBeDefined();
          return expect(promise.fail).toBeDefined();
        });
        describe("invalid arguments", function() {
          _when("no arguments passed", function() {
            return it("should call the fail callback", function() {
              var error, promise;
              promise = this.app.store.save();
              error = jasmine.createSpy('error');
              promise.fail(error);
              return expect(error).wasCalled();
            });
          });
          return _when("no object passed", function() {
            return it("should call the fail callback", function() {
              var error, promise;
              promise = this.app.store.save('document', 'abc4567');
              error = jasmine.createSpy('error');
              promise.fail(error);
              return expect(error).wasCalled();
            });
          });
        });
        _when("id is '123', type is 'document', object is {name: 'test'}", function() {
          beforeEach(function() {
            var object_string, _ref;
            spyOn(this.app.store, "_now").andReturn('now');
            this.promise = this.app.store.save('document', '123', {
              name: 'test'
            });
            _ref = this.app.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          it("should save a document with key '123'", function() {
            return expect(this.key).toBe('document/123');
          });
          it("should save a document with name = 'test'", function() {
            return expect(this.object.name).toBe('test');
          });
          it("should add timestamps", function() {
            expect(this.object.updated_at).toBe('now');
            return expect(this.object.created_at).toBe('now');
          });
          _when("successful", function() {
            beforeEach(function() {
              var _ref;
              this.success = jasmine.createSpy('success');
              this.promise.done(this.success);
              return this.args = (_ref = this.success.mostRecentCall) != null ? _ref.args[0] : void 0;
            });
            it("should call done callback", function() {
              return expect(this.success).wasCalled();
            });
            it("should pass the object to done callback", function() {
              return expect(this.args.name).toBe('test');
            });
            it("should add the id to passed object", function() {
              return expect(this.args.id).toBe('123');
            });
            return it("should add the id to passed object", function() {
              return expect(this.args.type).toBe('document');
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
              promise = this.app.store.save('document', '123', {
                name: 'test'
              });
              error = jasmine.createSpy('error');
              promise.fail(error);
              return expect(error).wasCalled();
            });
          });
        });
        _when("id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", function() {
          beforeEach(function() {
            var key, object_string, _ref;
            spyOn(this.app.store, "_now").andReturn('now');
            this.app.store.save('document', '123', {
              id: '123',
              type: 'document',
              name: 'test'
            });
            _ref = this.app.store._setItem.mostRecentCall.args, key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          it("should store the object without the id attribute", function() {
            return expect(this.object.id).toBeUndefined();
          });
          return it("should store the object without the type attribute", function() {
            return expect(this.object.type).toBeUndefined();
          });
        });
        it("should not overwrite created_at attribute", function() {
          var key, object, object_string, _ref;
          this.app.store.save('document', '123', {
            created_at: 'check12'
          });
          _ref = this.app.store._setItem.mostRecentCall.args, key = _ref[0], object_string = _ref[1];
          object = JSON.parse(object_string);
          return expect(object.created_at).toBe('check12');
        });
        it("should allow numbers and lowercase letters for for type & id only", function() {
          var invalid, key, promise, spy, _i, _j, _len, _len2, _results;
          invalid = ['UPPERCASE', 'under_lines', '-?&$'];
          for (_i = 0, _len = invalid.length; _i < _len; _i++) {
            key = invalid[_i];
            spy = jasmine.createSpy("fail with key = " + key);
            promise = this.app.store.save(key, 'valid', {});
            promise.fail(spy);
            expect(spy).wasCalled();
          }
          _results = [];
          for (_j = 0, _len2 = invalid.length; _j < _len2; _j++) {
            key = invalid[_j];
            spy = jasmine.createSpy("fail with key = " + key);
            promise = this.app.store.save('valid', key, {});
            promise.fail(spy);
            _results.push(expect(spy).wasCalled());
          }
          return _results;
        });
        _when("called without id", function() {
          _and("object has no id", function() {
            beforeEach(function() {
              var object_string, promise, _ref;
              promise = this.app.store.save('document', {
                name: 'test'
              });
              _ref = this.app.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
              return this.object = JSON.parse(object_string);
            });
            return it("should generate an id", function() {
              return expect(this.key).toMatch(/^document\/[a-z0-9]{7}$/);
            });
          });
          return _and("object has an id", function() {
            beforeEach(function() {
              var object_string, promise, _ref;
              promise = this.app.store.save('document', {
                name: 'test',
                id: 'exists'
              });
              _ref = this.app.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
              return this.object = JSON.parse(object_string);
            });
            return it("should get the id", function() {
              return expect(this.key).toBe('document/exists');
            });
          });
        });
        return _when("called without type and id", function() {
          _and("object has no id", function() {
            beforeEach(function() {
              var object_string, promise, _ref;
              promise = this.app.store.save({
                name: 'test',
                type: 'document'
              });
              _ref = this.app.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
              return this.object = JSON.parse(object_string);
            });
            return it("should generate an id and get the type from object", function() {
              return expect(this.key).toMatch(/^document\/[a-z0-9]{7}$/);
            });
          });
          return _and("object has an id", function() {
            beforeEach(function() {
              var object_string, promise, _ref;
              promise = this.app.store.save({
                name: 'test',
                type: 'document',
                id: 'exists'
              });
              _ref = this.app.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
              return this.object = JSON.parse(object_string);
            });
            return it("should get id and type form object", function() {
              return expect(this.key).toBe('document/exists');
            });
          });
        });
      });
      return describe(".get(type, id)", function() {
        it("should return a promise", function() {
          var promise;
          promise = this.app.store.get('document', '123');
          expect(promise.done).toBeDefined();
          return expect(promise.fail).toBeDefined();
        });
        describe("invalid arguments", function() {
          _when("no arguments passed", function() {
            return it("should call the fail callback", function() {
              var error, promise;
              promise = this.app.store.get();
              error = jasmine.createSpy('error');
              promise.fail(error);
              return expect(error).wasCalled();
            });
          });
          return _when("no id passed", function() {
            return it("should call the fail callback", function() {
              var error, promise;
              promise = this.app.store.get('document');
              error = jasmine.createSpy('error');
              promise.fail(error);
              return expect(error).wasCalled();
            });
          });
        });
        _when("object can be found", function() {
          beforeEach(function() {
            var object;
            object = {
              name: 'test'
            };
            this.app.store._getItem.andReturn(JSON.stringify(object));
            this.promise = this.app.store.get('document', 'abc4567');
            this.success = jasmine.createSpy('success');
            this.promise.done(this.success);
            return this.object = this.success.mostRecentCall.args[0];
          });
          it("should call the done callback", function() {
            return expect(this.success).wasCalled();
          });
          it("should set id attribute", function() {
            return expect(this.object.id).toBe('abc4567');
          });
          return it("should set type attribute", function() {
            return expect(this.object.type).toBe('document');
          });
        });
        _when("object cannot be found", function() {
          beforeEach(function() {
            this.app.store._getItem.andReturn(null);
            this.promise = this.app.store.get('document', 'abc4567');
            this.error = jasmine.createSpy('error');
            return this.promise.fail(this.error);
          });
          return it("should call the fail callback", function() {
            return expect(this.error).wasCalled();
          });
        });
        return it("should cache the object after the first get", function() {
          this.app.store.get('document', 'abc4567');
          this.app.store.get('document', 'abc4567');
          return expect(this.app.store._getItem.callCount).toBe(1);
        });
      });
    });
  });

}).call(this);
