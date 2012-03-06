
define('specs/store', ['store', 'couchapp'], function(Store, couchApp) {
  var app_mock;
  app_mock = (function() {

    function app_mock() {}

    app_mock.prototype.uuid = function() {
      return 'abc';
    };

    app_mock.prototype.trigger = function() {};

    return app_mock;

  })();
  return describe("Store", function() {
    beforeEach(function() {
      this.app = new app_mock;
      this.store = new Store(this.app);
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
    describe(".cache(type, id, object)", function() {
      beforeEach(function() {
        spyOn(this.store, "changed");
        spyOn(this.store, "clear_changed");
        spyOn(this.store, "is_dirty");
        spyOn(this.store, "is_marked_as_deleted");
        return this.store._cached = {};
      });
      _when("object passed", function() {
        it("should write the object to localStorage, but without type & id attributes", function() {
          this.store.cache('couch', '123', {
            color: 'red'
          });
          return expect(this.store._setItem).wasCalledWith('couch/123', '{"color":"red"}');
        });
        return _when("`options.remote = true` passed", function() {
          return it("should clear changed object", function() {
            this.store.cache('couch', '123', {
              color: 'red'
            }, {
              remote: true
            });
            return expect(this.store.clear_changed).wasCalledWith('couch', '123');
          });
        });
      });
      _when("no object passed", function() {
        _and("object is already cached", function() {
          beforeEach(function() {
            return this.store._cached['couch/123'] = {
              color: 'red'
            };
          });
          return it("should not load it from localStorage", function() {
            this.store.cache('couch', '123');
            return expect(this.store._getItem).wasNotCalled();
          });
        });
        return _and("object is not yet cached", function() {
          beforeEach(function() {
            return delete this.store._cached['couch/123'];
          });
          _and("object does exist in localStorage", function() {
            beforeEach(function() {
              return this.store._getItem.andReturn('{"color":"red"}');
            });
            return it("should cache it for future", function() {
              this.store.cache('couch', '123');
              return expect(this.store._cached['couch/123'].color).toBe('red');
            });
          });
          return _and("object does not exist in localStorage", function() {
            beforeEach(function() {
              return this.store._getItem.andReturn(null);
            });
            return it("should cache it for future", function() {
              this.store.cache('couch', '123');
              return expect(this.store._cached['couch/123']).toBe(false);
            });
          });
        });
      });
      _when("object is dirty", function() {
        beforeEach(function() {
          return this.store.is_dirty.andReturn(true);
        });
        return it("should mark it as changed", function() {
          this.store.cache('couch', '123');
          return expect(this.store.changed).wasCalledWith('couch', '123', {
            color: 'red',
            type: 'couch',
            id: '123'
          });
        });
      });
      _when("object is not dirty", function() {
        beforeEach(function() {
          return this.store.is_dirty.andReturn(false);
        });
        _and("not marked as deleted", function() {
          beforeEach(function() {
            return this.store.is_marked_as_deleted.andReturn(false);
          });
          return it("should clean it", function() {
            this.store.cache('couch', '123');
            return expect(this.store.clear_changed).wasCalledWith('couch', '123');
          });
        });
        return _but("marked as deleted", function() {
          beforeEach(function() {
            return this.store.is_marked_as_deleted.andReturn(true);
          });
          return it("should mark it as changed", function() {
            this.store.cache('couch', '123');
            return expect(this.store.changed).wasCalledWith('couch', '123', {
              color: 'red',
              type: 'couch',
              id: '123'
            });
          });
        });
      });
      return it("should return the object including type & id attrbiutes", function() {
        var obj;
        obj = this.store.cache('couch', '123', {
          color: 'red'
        });
        expect(obj.color).toBe('red');
        expect(obj.type).toBe('couch');
        return expect(obj.id).toBe('123');
      });
    });
    describe(".clear()", function() {
      beforeEach(function() {
        return spyOn(this.store, "_deferred").andReturn({
          resolve: jasmine.createSpy('resolve'),
          reject: jasmine.createSpy('reject')
        });
      });
      it("should return a promise", function() {
        var promise;
        promise = this.store.clear();
        return expect(promise).toBe(this.store._deferred());
      });
      it("should clear localStorage", function() {
        this.store.clear();
        return expect(this.store._clear).wasCalled();
      });
      it("should clear chache", function() {
        this.store._cached = 'funky';
        this.store.clear();
        return expect($.isEmptyObject(this.store._cached)).toBeTruthy();
      });
      it("should clear dirty docs", function() {
        spyOn(this.store, "clear_changed");
        this.store.clear();
        return expect(this.store.clear_changed).wasCalled();
      });
      it("should resolve promise", function() {
        this.store.clear();
        return expect(this.store._deferred().resolve).wasCalled();
      });
      return _when("an error occurs", function() {
        beforeEach(function() {
          return spyOn(this.store, "clear_changed").andCallFake(function() {
            throw new Error('ooops');
          });
        });
        return it("should reject the promise", function() {
          this.store.clear();
          return expect(this.store._deferred().reject).wasCalled();
        });
      });
    });
    describe(".is_dirty(type, id)", function() {
      _when("no arguments passed", function() {
        return it("returns true when there are no dirty documents", function() {
          this.store._dirty = {};
          return expect(this.store.is_dirty()).toBeTruthy();
        });
      });
      return _when("type & id passed", function() {
        _and("object was not yet synced", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              synced_at: void 0
            });
          });
          return it("should return true", function() {
            return expect(this.store.is_dirty('couch', '123')).toBeTruthy();
          });
        });
        return _and("object was synced", function() {
          _and("object was not updated yet", function() {
            beforeEach(function() {
              return spyOn(this.store, "cache").andReturn({
                synced_at: new Date(0),
                updated_at: void 0
              });
            });
            return it("should return false", function() {
              return expect(this.store.is_dirty('couch', '123')).toBeFalsy();
            });
          });
          _and("object was updated at the same time", function() {
            beforeEach(function() {
              return spyOn(this.store, "cache").andReturn({
                synced_at: new Date(0),
                updated_at: new Date(0)
              });
            });
            return it("should return false", function() {
              return expect(this.store.is_dirty('couch', '123')).toBeFalsy();
            });
          });
          return _and("object was updated later", function() {
            beforeEach(function() {
              return spyOn(this.store, "cache").andReturn({
                synced_at: new Date(0),
                updated_at: new Date(1)
              });
            });
            return it("should return true", function() {
              return expect(this.store.is_dirty('couch', '123')).toBeTruthy();
            });
          });
        });
      });
    });
    describe(".changed(type, id, object)", function() {
      beforeEach(function() {
        this.store._dirty = {};
        spyOn(window, "setTimeout").andReturn('new_timeout');
        spyOn(window, "clearTimeout");
        return spyOn(this.app, "trigger");
      });
      _when("object passed", function() {
        beforeEach(function() {
          return this.store.changed('couch', '123', {
            color: 'red'
          });
        });
        it("should add it to the dirty list", function() {
          return expect(this.store._dirty['couch/123'].color).toBe('red');
        });
        it("should should trigger an `store:dirty` event", function() {
          return expect(this.app.trigger).wasCalledWith('store:dirty');
        });
        it("should start dirty timeout for 2 seconds", function() {
          var args;
          args = window.setTimeout.mostRecentCall.args;
          expect(args[1]).toBe(2000);
          return expect(this.store._dirty_timeout).toBe('new_timeout');
        });
        return it("should clear dirty timeout", function() {
          this.store._dirty_timeout = 'timeout';
          this.store.changed('couch', '123', {
            color: 'red'
          });
          return expect(window.clearTimeout).wasCalledWith('timeout');
        });
      });
      _when("no object passed", function() {
        it("should return true if the object is dirty", function() {
          var res;
          this.store._dirty['couch/123'] = {
            color: 'red'
          };
          res = this.store.changed('couch', '123');
          return expect(res).toBeTruthy();
        });
        return it("should return false if the object isn't dirty", function() {
          var res;
          delete this.store._dirty['couch/123'];
          res = this.store.changed('couch', '123');
          return expect(res).toBeFalsy();
        });
      });
      return _when("no arguments passed", function() {
        return it("should return all dirty objects", function() {
          var res;
          this.store._dirty = 'so so dirty';
          res = this.store.changed();
          return expect(res).toBe('so so dirty');
        });
      });
    });
    describe(".is_marked_as_deleted(type, id)", function() {
      _when("object 'couch/123' is marked as deleted", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn({
            _deleted: true
          });
        });
        return it("should return true", function() {
          return this.store.is_marked_as_deleted('couch', '123');
        });
      });
      return _when("object 'couch/123' isn't marked as deleted", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn({});
        });
        return it("should return false", function() {
          return this.store.is_marked_as_deleted('couch', '123');
        });
      });
    });
    describe(".clear_changed(type, id)", function() {
      _when("type & id passed", function() {
        return it("should remove the respective object from the dirty list", function() {
          this.store._dirty['couch/123'] = {
            color: 'red'
          };
          this.store.clear_changed('couch', 123);
          return expect(this.store._dirty['couch/123']).toBeUndefined();
        });
      });
      _when("no arguments passed", function() {
        return it("should remove all objects from the dirty list", function() {
          this.store._dirty = {
            'couch/123': {
              color: 'red'
            },
            'couch/456': {
              color: 'green'
            }
          };
          this.store.clear_changed();
          return expect(JSON.stringify(this.store._dirty)).toBe('{}');
        });
      });
      return it("should trigger a `store:dirty` event", function() {
        spyOn(this.app, "trigger");
        this.store.clear_changed();
        return expect(this.app.trigger).wasCalledWith('store:dirty');
      });
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
