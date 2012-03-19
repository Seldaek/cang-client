
define('specs/store', ['store', 'mocks/couchapp'], function(Store, couchAppMock) {
  return describe("Store", function() {
    beforeEach(function() {
      this.app = new couchAppMock;
      this.store = new Store(this.app);
      spyOn(this.app.promise_mock, "resolve").andCallThrough();
      spyOn(this.app.promise_mock, "reject").andCallThrough();
      spyOn(this.app.promise_mock, "fail").andCallThrough();
      spyOn(this.app.promise_mock, "done").andCallThrough();
      spyOn(this.store, "_setObject").andCallThrough();
      spyOn(this.store, "_getObject").andCallThrough();
      spyOn(this.store.db, "getItem").andCallThrough();
      spyOn(this.store.db, "setItem").andCallThrough();
      spyOn(this.store.db, "removeItem").andCallThrough();
      return spyOn(this.store.db, "clear").andCallThrough();
    });
    describe("new", function() {
      return it("should subscribe to account:sign_out event", function() {
        var store;
        spyOn(this.app, "on");
        store = new Store(this.app);
        return expect(this.app.on).wasCalledWith('account:sign_out', store.clear);
      });
    });
    describe(".save(type, id, object, options)", function() {
      beforeEach(function() {
        spyOn(this.store, "_now").andReturn('now');
        return spyOn(this.store, "cache").andReturn('cached_object');
      });
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
            var promise;
            promise = this.store.save();
            return expect(promise.reject).wasCalled();
          });
        });
        return _when("no object passed", function() {
          return it("should call the fail callback", function() {
            var promise;
            promise = this.store.save('document', 'abc4567');
            return expect(promise.reject).wasCalled();
          });
        });
      });
      _when("id is '123', type is 'document', object is {name: 'test'}", function() {
        beforeEach(function() {
          return this.promise = this.store.save('document', '123', {
            name: 'test'
          }, {
            option: 'value'
          });
        });
        it("should cache document", function() {
          return expect(this.store.cache).wasCalled();
        });
        it("should add timestamps", function() {
          var object;
          object = this.store.cache.mostRecentCall.args[2];
          expect(object.created_at).toBe('now');
          return expect(object.updated_at).toBe('now');
        });
        _and("options.remote is true", function() {
          it("should not touch created_at / updated_at timestamps", function() {
            var object;
            this.store.save('document', '123', {
              name: 'test'
            }, {
              remote: true
            });
            object = this.store.cache.mostRecentCall.args[2];
            expect(object.created_at).toBeUndefined();
            return expect(object.updated_at).toBeUndefined();
          });
          return it("should add a _synced_at timestamp", function() {
            var object;
            this.store.save('document', '123', {
              name: 'test'
            }, {
              remote: true
            });
            object = this.store.cache.mostRecentCall.args[2];
            return expect(object._synced_at).toBe('now');
          });
        });
        it("should pass options", function() {
          var options;
          options = this.store.cache.mostRecentCall.args[3];
          return expect(options.option).toBe('value');
        });
        _when("successful", function() {
          beforeEach(function() {
            var _ref;
            return this.args = (_ref = this.promise.resolve.mostRecentCall) != null ? _ref.args[0] : void 0;
          });
          it("should resolve the promise", function() {
            return expect(this.promise.resolve).wasCalled();
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
            var promise;
            promise = this.store.save('document', '123', {
              name: 'test'
            });
            return expect(promise.reject).wasCalled();
          });
        });
      });
      _when("id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", function() {
        beforeEach(function() {
          var key, type, _ref;
          this.store.save('document', '123', {
            id: '123',
            type: 'document',
            name: 'test'
          });
          return _ref = this.store.cache.mostRecentCall.args, type = _ref[0], key = _ref[1], this.object = _ref[2], _ref;
        });
        it("should cache the object without the id attribute", function() {
          return expect(this.object.id).toBeUndefined();
        });
        return it("should store the object without the type attribute", function() {
          return expect(this.object.type).toBeUndefined();
        });
      });
      it("should not overwrite created_at attribute", function() {
        var id, object, type, _ref;
        this.store.save('document', '123', {
          created_at: 'check12'
        });
        _ref = this.store.cache.mostRecentCall.args, type = _ref[0], id = _ref[1], object = _ref[2];
        return expect(object.created_at).toBe('check12');
      });
      it("should allow numbers and lowercase letters for for type & id only", function() {
        var invalid, key, promise, _i, _j, _len, _len2, _results;
        invalid = ['UPPERCASE', 'under_lines', '-?&$'];
        for (_i = 0, _len = invalid.length; _i < _len; _i++) {
          key = invalid[_i];
          promise = this.store.save(key, 'valid', {});
          expect(promise.reject).wasCalled();
        }
        _results = [];
        for (_j = 0, _len2 = invalid.length; _j < _len2; _j++) {
          key = invalid[_j];
          promise = this.store.save('valid', key, {});
          _results.push(expect(promise.reject).wasCalled());
        }
        return _results;
      });
      _when("called without id", function() {
        _and("object has no id", function() {
          beforeEach(function() {
            var _ref;
            this.store.save('document', {
              name: 'test'
            }, {
              option: 'value'
            });
            return _ref = this.store.cache.mostRecentCall.args, this.type = _ref[0], this.key = _ref[1], this.object = _ref[2], _ref;
          });
          it("should generate an id", function() {
            return expect(this.key).toMatch(/^[a-z0-9]{7}$/);
          });
          return it("should pass options", function() {
            var options;
            options = this.store.cache.mostRecentCall.args[3];
            return expect(options.option).toBe('value');
          });
        });
        return _and("object has an id", function() {
          beforeEach(function() {
            var promise, type, _ref;
            promise = this.store.save('document', {
              name: 'test',
              id: 'exists'
            });
            return _ref = this.store.cache.mostRecentCall.args, type = _ref[0], this.key = _ref[1], this.object = _ref[2], _ref;
          });
          return it("should get the id", function() {
            return expect(this.key).toBe('exists');
          });
        });
      });
      _when("called without type and id", function() {
        _and("object has no id", function() {
          beforeEach(function() {
            var promise, _ref;
            promise = this.store.save({
              name: 'test',
              type: 'document'
            });
            return _ref = this.store.cache.mostRecentCall.args, this.type = _ref[0], this.key = _ref[1], this.object = _ref[2], _ref;
          });
          return it("should generate an id and get the type from object", function() {
            return expect(this.key).toMatch(/^[a-z0-9]{7}$/);
          });
        });
        return _and("object has an id", function() {
          beforeEach(function() {
            var promise, type, _ref;
            promise = this.store.save({
              name: 'test',
              type: 'document',
              id: 'exists'
            });
            return _ref = this.store.cache.mostRecentCall.args, type = _ref[0], this.key = _ref[1], this.object = _ref[2], _ref;
          });
          return it("should get id and type form object", function() {
            return expect(this.key).toBe('exists');
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
            var promise;
            promise = this.store.load();
            return expect(promise.reject).wasCalled();
          });
        });
        return _when("no id passed", function() {
          return it("should call the fail callback", function() {
            var promise;
            promise = this.store.load('document');
            return expect(promise.reject).wasCalled();
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
          return this.promise = this.store.load('document', 'abc4567');
        });
        return it("should call the done callback", function() {
          return expect(this.promise.resolve).wasCalled();
        });
      });
      _when("object cannot be found", function() {
        beforeEach(function() {
          this.store.cache.andReturn(false);
          return this.promise = this.store.load('document', 'abc4567');
        });
        return it("should call the fail callback", function() {
          return expect(this.promise.reject).wasCalled();
        });
      });
      it("should cache the object after the first get", function() {
        this.store.load('document', 'abc4567');
        this.store.load('document', 'abc4567');
        return expect(this.store.db.getItem.callCount).toBe(1);
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
            results = promise.resolve.mostRecentCall.args[0];
            return expect(results.length).toBe(5);
          });
        });
        _and("no documents exist in the store", function() {
          beforeEach(function() {
            return spyOn(this.store, "_index").andReturn([]);
          });
          return it("should return an empty array", function() {
            var promise;
            promise = this.store.loadAll();
            return expect(promise.resolve).wasCalledWith([]);
          });
        });
        return _and("there are other documents in localStorage not stored with store", function() {
          beforeEach(function() {
            spyOn(this.store, "_index").andReturn(["_some_config", "some_other_shizzle", "whatever", "valid/123"]);
            return spyOn(this.store, "cache").andReturn({});
          });
          return it("should not return them", function() {
            var promise, results;
            promise = this.store.loadAll();
            results = promise.resolve.mostRecentCall.args[0];
            return expect(results.length).toBe(1);
          });
        });
      });
      _when("called with type = 'cat'", function() {
        return with_2_cats_and_3_dogs(function() {
          return it("should return only the cat objects", function() {
            var promise, results;
            promise = this.store.loadAll('cat');
            results = promise.resolve.mostRecentCall.args[0];
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
    describe(".delete(type, id)", function() {
      _when("objecet cannot be found", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn(false);
        });
        return it("should return a rejected the promise", function() {
          var promise;
          promise = this.store["delete"]('document', '123');
          return expect(promise.reject).wasCalled();
        });
      });
      _when("object can be found and has not been synched before", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn({});
        });
        it("should remove the object", function() {
          this.store["delete"]('document', '123');
          return expect(this.store.db.removeItem).wasCalledWith('document/123');
        });
        it("should set the _cached object to false", function() {
          delete this.store._cached['document/123'];
          this.store["delete"]('document', '123');
          return expect(this.store._cached['document/123']).toBe(false);
        });
        it("should clear document from changed", function() {
          spyOn(this.store, "clear_changed");
          this.store["delete"]('document', '123');
          return expect(this.store.clear_changed).wasCalledWith('document', '123');
        });
        it("should return a resolved promise", function() {
          var promise;
          promise = this.store["delete"]('document', '123');
          return expect(promise.resolve).wasCalledWith({});
        });
        return it("should return a clone of the cached object (before it was deleted)", function() {
          var promise;
          spyOn($, "extend");
          promise = this.store["delete"]('document', '123', {
            remote: true
          });
          return expect($.extend).wasCalled();
        });
      });
      _when("object can be found and delete comes from remote", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn({
            _synced_at: 'now'
          });
        });
        return it("should remove the object", function() {
          this.store["delete"]('document', '123', {
            remote: true
          });
          return expect(this.store.db.removeItem).wasCalledWith('document/123');
        });
      });
      _when("object can be found and was synched before", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn({
            _synced_at: 'now'
          });
        });
        it("should mark the object as deleted and cache it", function() {
          var promise;
          promise = this.store["delete"]('document', '123');
          return expect(this.store.cache).wasCalledWith('document', '123', {
            _synced_at: 'now',
            _deleted: true
          });
        });
        return it("should not remove the object from store", function() {
          this.store["delete"]('document', '123');
          return expect(this.store.db.removeItem).wasNotCalled();
        });
      });
      return describe("aliases", function() {
        return it("should allow to use .destroy", function() {
          return expect(this.store.destroy).toBe(this.store["delete"]);
        });
      });
    });
    describe(".cache(type, id, object)", function() {
      beforeEach(function() {
        spyOn(this.store, "mark_as_changed");
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
          return expect(this.store.db.setItem).wasCalledWith('couch/123', '{"color":"red"}');
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
            return expect(this.store.db.getItem).wasNotCalled();
          });
        });
        return _and("object is not yet cached", function() {
          beforeEach(function() {
            return delete this.store._cached['couch/123'];
          });
          _and("object does exist in localStorage", function() {
            beforeEach(function() {
              return this.store._getObject.andReturn({
                color: 'red'
              });
            });
            return it("should cache it for future", function() {
              this.store._getObject.andReturn({
                color: 'red'
              });
              this.store.cache('couch', '123');
              return expect(this.store._cached['couch/123'].color).toBe('red');
            });
          });
          return _and("object does not exist in localStorage", function() {
            beforeEach(function() {
              return this.store._getObject.andReturn(false);
            });
            it("should cache it for future", function() {
              this.store.cache('couch', '123');
              return expect(this.store._cached['couch/123']).toBe(false);
            });
            return it("should return false", function() {
              return expect(this.store.cache('couch', '123')).toBe(false);
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
          return expect(this.store.mark_as_changed).wasCalledWith('couch', '123', {
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
            return expect(this.store.mark_as_changed).wasCalledWith('couch', '123', {
              color: 'red',
              type: 'couch',
              id: '123'
            });
          });
        });
      });
      return it("should return the object including type & id attributes", function() {
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
      it("should return a promise", function() {
        var promise;
        promise = this.store.clear();
        return expect(promise).toBe(this.app.promise_mock);
      });
      it("should clear localStorage", function() {
        this.store.clear();
        return expect(this.store.db.clear).wasCalled();
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
        return expect(this.app.promise().resolve).wasCalled();
      });
      return _when("an error occurs", function() {
        beforeEach(function() {
          return spyOn(this.store, "clear_changed").andCallFake(function() {
            throw new Error('ooops');
          });
        });
        return it("should reject the promise", function() {
          this.store.clear();
          return expect(this.app.promise().reject).wasCalled();
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
      _when("type & id passed", function() {
        _and("object was not yet synced", function() {
          beforeEach(function() {
            return spyOn(this.store, "cache").andReturn({
              _synced_at: void 0
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
                _synced_at: new Date(0),
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
                _synced_at: new Date(0),
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
                _synced_at: new Date(0),
                updated_at: new Date(1)
              });
            });
            return it("should return true", function() {
              return expect(this.store.is_dirty('couch', '123')).toBeTruthy();
            });
          });
        });
      });
      return _when("object passed", function() {
        _and("it is dirty", function() {
          return it("should return true", function() {
            var it_is_dirty;
            it_is_dirty = this.store.is_dirty({
              _synced_at: void 0
            });
            return expect(it_is_dirty).toBeTruthy();
          });
        });
        return _and("object isn't dirty", function() {
          return it("should return false", function() {
            var it_is_dirty;
            it_is_dirty = this.store.is_dirty({
              updated_at: new Date(0),
              _synced_at: new Date(0)
            });
            return expect(it_is_dirty).toBeFalsy();
          });
        });
      });
    });
    describe(".mark_as_changed(type, id, object)", function() {
      beforeEach(function() {
        this.store._dirty = {};
        spyOn(window, "setTimeout").andReturn('new_timeout');
        spyOn(window, "clearTimeout");
        spyOn(this.app, "trigger");
        return this.store.mark_as_changed('couch', '123', {
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
        this.store.mark_as_changed('couch', '123', {
          color: 'red'
        });
        return expect(window.clearTimeout).wasCalledWith('timeout');
      });
    });
    describe(".changed_docs()", function() {
      _when("there are no changed docs", function() {
        beforeEach(function() {
          return this.store._dirty = {};
        });
        return it("should return an empty array", function() {
          expect($.isArray(this.store.changed_docs())).toBeTruthy();
          return expect(this.store.changed_docs().length).toBe(0);
        });
      });
      return _when("there are 2 dirty docs", function() {
        beforeEach(function() {
          return this.store._dirty = [
            {
              type: 'couch',
              id: '123',
              color: 'red'
            }, {
              type: 'couch',
              id: '456',
              color: 'green'
            }
          ];
        });
        return it("should return the two docs", function() {
          return expect(this.store.changed_docs().length).toBe(2);
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
          return expect(this.store.is_marked_as_deleted('couch', '123')).toBeTruthy();
        });
      });
      _when("object 'couch/123' isn't marked as deleted", function() {
        beforeEach(function() {
          return spyOn(this.store, "cache").andReturn({});
        });
        return it("should return false", function() {
          return expect(this.store.is_marked_as_deleted('couch', '123')).toBeFalsy();
        });
      });
      return _when("passed object is marked as deleted", function() {
        return it("should return true", function() {
          return expect(this.store.is_marked_as_deleted({
            _deleted: true
          })).toBeTruthy();
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
          return expect($.isEmptyObject(this.store._dirty)).toBeTruthy();
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
