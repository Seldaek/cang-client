
define('specs/store', ['store', 'couchapp'], function(Store, couchApp) {
  var app_mock;
  app_mock = {
    uuid: function() {
      return 'abc';
    },
    trigger: function() {}
  };
  return describe("Store", function() {
    beforeEach(function() {
      this.store = new Store(app_mock);
      spyOn(this.store, "_getItem").andCallThrough();
      spyOn(this.store, "_setItem").andCallThrough();
      spyOn(this.store, "_removeItem").andCallThrough();
      return spyOn(this.store, "_clear").andCallThrough();
    });
    describe(".save(type, id, object)", function() {
      it("should return a promise", function() {
        var promise;
        promise = this.store.save('document', '123', {
          name: 'test'
        });
        expect(promise.done).toBeDefined();
        return expect(promise.fail).toBeDefined();
      });
      describe("invalid arguments", function() {
        _when("no arguments passed", function() {
          return it("should call the fail callback", function() {
            var error, promise;
            promise = this.store.save();
            error = jasmine.createSpy('error');
            promise.fail(error);
            return expect(error).wasCalled();
          });
        });
        return _when("no object passed", function() {
          return it("should call the fail callback", function() {
            var error, promise;
            promise = this.store.save('document', 'abc4567');
            error = jasmine.createSpy('error');
            promise.fail(error);
            return expect(error).wasCalled();
          });
        });
      });
      _when("id is '123', type is 'document', object is {name: 'test'}", function() {
        beforeEach(function() {
          spyOn(this.store, "_now").andReturn('now');
          spyOn(this.store, "cache").andReturn('cached_object');
          return this.promise = this.store.save('document', '123', {
            name: 'test'
          });
        });
        it("should cache document", function() {
          return expect(this.store.cache).wasCalled();
        });
        it("should add timestamps", function() {
          return expect(this.store.cache).wasCalledWith('document', '123', {
            name: 'test',
            created_at: 'now',
            updated_at: 'now'
          });
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
          return it("should pass the object to done callback", function() {
            return expect(this.args).toBe('cached_object');
          });
        });
        return _when("failed", function() {
          beforeEach(function() {
            return this.store.cache.andCallFake(function() {
              throw new Error("i/o error");
            });
          });
          return it("should call fail callback", function() {
            var error, promise;
            promise = this.store.save('document', '123', {
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
          spyOn(this.store, "_now").andReturn('now');
          this.store.save('document', '123', {
            id: '123',
            type: 'document',
            name: 'test'
          });
          _ref = this.store._setItem.mostRecentCall.args, key = _ref[0], object_string = _ref[1];
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
        this.store.save('document', '123', {
          created_at: 'check12'
        });
        _ref = this.store._setItem.mostRecentCall.args, key = _ref[0], object_string = _ref[1];
        object = JSON.parse(object_string);
        return expect(object.created_at).toBe('check12');
      });
      it("should allow numbers and lowercase letters for for type & id only", function() {
        var invalid, key, promise, spy, _i, _j, _len, _len2, _results;
        invalid = ['UPPERCASE', 'under_lines', '-?&$'];
        for (_i = 0, _len = invalid.length; _i < _len; _i++) {
          key = invalid[_i];
          spy = jasmine.createSpy("fail with key = " + key);
          promise = this.store.save(key, 'valid', {});
          promise.fail(spy);
          expect(spy).wasCalled();
        }
        _results = [];
        for (_j = 0, _len2 = invalid.length; _j < _len2; _j++) {
          key = invalid[_j];
          spy = jasmine.createSpy("fail with key = " + key);
          promise = this.store.save('valid', key, {});
          promise.fail(spy);
          _results.push(expect(spy).wasCalled());
        }
        return _results;
      });
      _when("called without id", function() {
        _and("object has no id", function() {
          beforeEach(function() {
            var object_string, promise, _ref;
            promise = this.store.save('document', {
              name: 'test'
            });
            _ref = this.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          return it("should generate an id", function() {
            return expect(this.key).toMatch(/^document\/[a-z0-9]{7}$/);
          });
        });
        return _and("object has an id", function() {
          beforeEach(function() {
            var object_string, promise, _ref;
            promise = this.store.save('document', {
              name: 'test',
              id: 'exists'
            });
            _ref = this.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          return it("should get the id", function() {
            return expect(this.key).toBe('document/exists');
          });
        });
      });
      _when("called without type and id", function() {
        _and("object has no id", function() {
          beforeEach(function() {
            var object_string, promise, _ref;
            promise = this.store.save({
              name: 'test',
              type: 'document'
            });
            _ref = this.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          return it("should generate an id and get the type from object", function() {
            return expect(this.key).toMatch(/^document\/[a-z0-9]{7}$/);
          });
        });
        return _and("object has an id", function() {
          beforeEach(function() {
            var object_string, promise, _ref;
            promise = this.store.save({
              name: 'test',
              type: 'document',
              id: 'exists'
            });
            _ref = this.store._setItem.mostRecentCall.args, this.key = _ref[0], object_string = _ref[1];
            return this.object = JSON.parse(object_string);
          });
          return it("should get id and type form object", function() {
            return expect(this.key).toBe('document/exists');
          });
        });
      });
      return describe("aliases", function() {
        it("should allow to use .create", function() {
          return expect(this.store.save).toBe(this.store.create);
        });
        return it("should allow to use .update", function() {
          return expect(this.store.save).toBe(this.store.create);
        });
      });
    });
    describe(".load(type, id)", function() {
      beforeEach(function() {
        return spyOn(this.store, "cache").andCallThrough();
      });
      it("should return a promise", function() {
        var promise;
        promise = this.store.load('document', '123');
        expect(promise.done).toBeDefined();
        return expect(promise.fail).toBeDefined();
      });
      describe("invalid arguments", function() {
        _when("no arguments passed", function() {
          return it("should call the fail callback", function() {
            var error, promise;
            promise = this.store.load();
            error = jasmine.createSpy('error');
            promise.fail(error);
            return expect(error).wasCalled();
          });
        });
        return _when("no id passed", function() {
          return it("should call the fail callback", function() {
            var error, promise;
            promise = this.store.load('document');
            error = jasmine.createSpy('error');
            promise.fail(error);
            return expect(error).wasCalled();
          });
        });
      });
      it("should allow to pass an object as paramter {type: 'car', id: 'abc4567'}", function() {
        this.store.load({
          type: 'car',
          id: 'abc4567'
        });
        return expect(this.store.cache).wasCalled();
      });
      _when("object can be found", function() {
        beforeEach(function() {
          this.store.cache.andReturn({
            name: 'test'
          });
          this.promise = this.store.load('document', 'abc4567');
          this.success = jasmine.createSpy('success');
          this.promise.done(this.success);
          return this.object = this.success.mostRecentCall.args[0];
        });
        return it("should call the done callback", function() {
          return expect(this.success).wasCalled();
        });
      });
      _when("object cannot be found", function() {
        beforeEach(function() {
          this.store.cache.andReturn(false);
          this.promise = this.store.load('document', 'abc4567');
          this.error = jasmine.createSpy('error');
          return this.promise.fail(this.error);
        });
        return it("should call the fail callback", function() {
          return expect(this.error).wasCalled();
        });
      });
      it("should cache the object after the first get", function() {
        this.store.load('document', 'abc4567');
        this.store.load('document', 'abc4567');
        return expect(this.store._getItem.callCount).toBe(1);
      });
      return describe("aliases", function() {
        return it("should allow to use .get", function() {
          return expect(this.store.get).toBe(this.store.load);
        });
      });
    });
    describe(".loadAll(type)", function() {
      var with_2_cats_and_3_dogs;
      with_2_cats_and_3_dogs = function(specs) {
        return _and("two cat and three dog objects exist in the store", function() {
          beforeEach(function() {
            spyOn(this.store, "_index").andReturn(["cat/1", "cat/2", "dog/1", "dog/2", "dog/3"]);
            return spyOn(this.store, "cache").andReturn({
              name: 'becks'
            });
          });
          return specs();
        });
      };
      it("should return a promise", function() {
        var promise;
        promise = this.store.loadAll('document');
        expect(promise.done).toBeDefined();
        return expect(promise.fail).toBeDefined();
      });
      _when("called without a type", function() {
        with_2_cats_and_3_dogs(function() {
          return it("should return'em all", function() {
            var promise, results, success;
            success = jasmine.createSpy('success');
            promise = this.store.loadAll();
            promise.done(success);
            results = success.mostRecentCall.args[0];
            return expect(results.length).toBe(5);
          });
        });
        _and("no documents exist in the store", function() {
          beforeEach(function() {
            return spyOn(this.store, "_index").andReturn([]);
          });
          return it("should return an empty array", function() {
            var promise, success;
            success = jasmine.createSpy('success');
            promise = this.store.loadAll();
            promise.done(success);
            return expect(success).wasCalledWith([]);
          });
        });
        return _and("there are other documents in localStorage not stored with store", function() {
          beforeEach(function() {
            spyOn(this.store, "_index").andReturn(["_some_config", "some_other_shizzle", "whatever", "valid/123"]);
            return spyOn(this.store, "cache").andReturn({});
          });
          return it("should not return them", function() {
            var promise, results, success;
            success = jasmine.createSpy('success');
            promise = this.store.loadAll();
            promise.done(success);
            results = success.mostRecentCall.args[0];
            return expect(results.length).toBe(1);
          });
        });
      });
      _when("called with type = 'cat'", function() {
        return with_2_cats_and_3_dogs(function() {
          return it("should return only the cat objects", function() {
            var promise, results, success;
            success = jasmine.createSpy('success');
            promise = this.store.loadAll('cat');
            promise.done(success);
            results = success.mostRecentCall.args[0];
            return expect(results.length).toBe(2);
          });
        });
      });
      return describe("aliases", function() {
        return it("should allow to use .getAll", function() {
          return expect(this.store.getAll).toBe(this.store.loadAll);
        });
      });
    });
    describe(".destroy(type, id)", function() {
      it("should return a promise", function() {
        var promise;
        promise = this.store.destroy('document', '123');
        expect(promise.done).toBeDefined();
        return expect(promise.fail).toBeDefined();
      });
      it("should have more specs");
      return describe("aliases", function() {
        return it("should allow to use .create", function() {
          return expect(this.store["delete"]).toBe(this.store.destroy);
        });
      });
    });
    describe(".cache(type, id, object)", function() {});
    describe(".clear()", function() {
      return it("should have some specs");
    });
    describe(".is_dirty(type, id)", function() {
      return it("should have some specs");
    });
    describe(".changed(type, id, value)", function() {
      return it("should have some specs");
    });
    describe(".is_marked_as_deleted(type, id)", function() {
      return it("should have some specs");
    });
    describe(".clear_changed()", function() {
      return it("should have some specs");
    });
    return describe(".uuid(num = 7)", function() {
      it("should default to a length of 7", function() {
        return expect(this.store.uuid().length).toBe(7);
      });
      return _when("called with num = 5", function() {
        return it("should generate an id with length = 5", function() {
          return expect(this.store.uuid(5).length).toBe(5);
        });
      });
    });
  });
});
