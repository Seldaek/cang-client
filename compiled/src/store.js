var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('store', ['errors'], function(ERROR) {
  'use strict';
  var Store;
  return Store = (function() {

    function Store(app) {
      this.app = app;
      this.clear = __bind(this.clear, this);
      if (!this.is_persistent()) {
        this.db = {
          getItem: function() {
            return null;
          },
          setItem: function() {
            return null;
          },
          removeItem: function() {
            return null;
          },
          key: function() {
            return null;
          },
          length: function() {
            return 0;
          },
          clear: function() {
            return null;
          }
        };
      }
      this.app.on('account:sign_out', this.clear);
    }

    Store.prototype.db = {
      getItem: function(key) {
        return window.localStorage.getItem(key);
      },
      setItem: function(key, value) {
        return window.localStorage.setItem(key, value);
      },
      removeItem: function(key) {
        return window.localStorage.removeItem(key);
      },
      key: function(nr) {
        return window.localStorage.key(nr);
      },
      length: function() {
        return window.localStorage.length;
      },
      clear: function() {
        return window.localStorage.clear();
      }
    };

    Store.prototype.save = function(type, id, object, options) {
      var promise;
      promise = this._promise();
      switch ('object') {
        case typeof arguments[0]:
          options = id;
          object = type;
          type = object.type;
          id = object.id;
          break;
        case typeof arguments[1]:
          options = object;
          object = id;
          id = object.id;
      }
      if (typeof object !== 'object') {
        promise.reject(ERROR.INVALID_ARGUMENTS("object is " + (typeof object)));
        return promise;
      }
      id || (id = this.uuid());
      if (!this._is_valid_key(id)) {
        promise.reject(ERROR.INVALID_KEY({
          id: id
        }));
        return promise;
      }
      if (!this._is_valid_key(type)) {
        promise.reject(ERROR.INVALID_KEY({
          type: type
        }));
        return promise;
      }
      if (options != null ? options.remote : void 0) {
        object._synced_at = this._now();
      } else {
        object.updated_at = this._now();
        object.created_at || (object.created_at = object.updated_at);
      }
      delete object.id;
      delete object.type;
      try {
        object = this.cache(type, id, object, options);
        promise.resolve(object);
      } catch (error) {
        promise.reject(error);
      }
      return promise;
    };

    Store.prototype.create = Store.prototype.save;

    Store.prototype.update = Store.prototype.save;

    Store.prototype.load = function(type, id) {
      var object, promise, _ref;
      promise = this._promise();
      if (arguments.length = 1 && typeof type === 'object') {
        _ref = [type.type, type.id], type = _ref[0], id = _ref[1];
      }
      if (!(typeof type === 'string' && typeof id === 'string')) {
        return promise.reject(ERROR.INVALID_ARGUMENTS("type & id are required"));
      }
      try {
        object = this.cache(type, id);
        if (!object) {
          promise.reject(ERROR.NOT_FOUND(type, id));
          return promise;
        }
        promise.resolve(object);
      } catch (error) {
        promise.reject(error);
      }
      return promise;
    };

    Store.prototype.get = Store.prototype.load;

    Store.prototype.loadAll = function(type) {
      var id, key, keys, promise, results, _type;
      promise = this._promise();
      keys = this._index();
      try {
        results = (function() {
          var _i, _len, _ref, _results;
          _results = [];
          for (_i = 0, _len = keys.length; _i < _len; _i++) {
            key = keys[_i];
            if (!((type === void 0 || key.indexOf(type) === 0) && this._is_semantic_id(key))) {
              continue;
            }
            _ref = key.split('/'), _type = _ref[0], id = _ref[1];
            _results.push(this.cache(_type, id));
          }
          return _results;
        }).call(this);
        promise.resolve(results);
      } catch (error) {
        promise.reject(error);
      }
      return promise;
    };

    Store.prototype.getAll = Store.prototype.loadAll;

    Store.prototype.destroy = function(type, id) {
      var key, object, promise;
      promise = this._promise();
      object = this.cache(type, id);
      if (!object) return promise.reject(ERROR.NOT_FOUND(type, id));
      if (object._rev) {
        object._deleted = true;
        this.cache(type, id, object);
      } else {
        key = "" + type + "/" + id;
        this.db.removeItem(key);
        delete this._cached[key];
        this.clear_changed(type, id);
      }
      return promise.resolve(object);
    };

    Store.prototype["delete"] = Store.prototype.destroy;

    Store.prototype.cache = function(type, id, object, options) {
      var key;
      if (object == null) object = false;
      if (options == null) options = {};
      key = "" + type + "/" + id;
      if (object) {
        if (this.is_marked_as_deleted(object)) {
          this._cached[key] = false;
          this.db.removeItem(key);
        } else {
          this._cached[key] = $.extend(object, {
            type: type,
            id: id
          });
          this._setObject(type, id, object);
        }
        if (options.remote) {
          this.clear_changed(type, id);
          return true;
        }
      } else {
        if (this._cached[key] != null) return this._cached[key];
        this._cached[key] = this._getObject(type, id);
      }
      if (this.is_dirty(object) || this.is_marked_as_deleted(object)) {
        this.mark_as_changed(type, id, this._cached[key]);
      } else {
        this.clear_changed(type, id);
      }
      return this._cached[key];
    };

    Store.prototype.clear_changed = function(type, id) {
      var key;
      if (type && id) {
        key = "" + type + "/" + id;
        delete this._dirty[key];
      } else {
        this._dirty = {};
      }
      return this.app.trigger('store:dirty');
    };

    Store.prototype.is_marked_as_deleted = function(type, id) {
      if (typeof type === 'object') {
        return type._deleted === true;
      } else {
        return this.cache(type, id)._deleted === true;
      }
    };

    Store.prototype.mark_as_changed = function(type, id, object) {
      var key, timeout,
        _this = this;
      key = "" + type + "/" + id;
      this._dirty[key] = object;
      this.app.trigger('store:dirty');
      timeout = 2000;
      window.clearTimeout(this._dirty_timeout);
      return this._dirty_timeout = window.setTimeout((function() {
        return _this.app.trigger('store:dirty:idle');
      }), timeout);
    };

    Store.prototype.changed_docs = function() {
      var key, object, _ref, _results;
      _ref = this._dirty;
      _results = [];
      for (key in _ref) {
        object = _ref[key];
        _results.push(object);
      }
      return _results;
    };

    Store.prototype.is_dirty = function(type, id) {
      var obj;
      if (!type) return $.isEmptyObject(this._dirty);
      if (typeof type === 'object') {
        obj = type;
      } else {
        obj = this.cache(type, id);
      }
      if (!obj._synced_at) return true;
      if (!obj.updated_at) return false;
      return obj._synced_at.getTime() < obj.updated_at.getTime();
    };

    Store.prototype.clear = function() {
      var promise;
      promise = this._promise();
      try {
        this.db.clear();
        this._cached = {};
        this.clear_changed();
        promise.resolve();
      } catch (error) {
        promise.reject(error);
      }
      return promise;
    };

    Store.prototype.is_persistent = function() {
      try {
        if (!window.localStorage) return false;
        localStorage.setItem('Storage-Test', "1");
        if (localStorage.getItem('Storage-Test') !== "1") return false;
        localStorage.removeItem('Storage-Test');
      } catch (e) {
        return false;
      }
      return true;
    };

    Store.prototype.uuid = function(len) {
      var chars, i, radix;
      if (len == null) len = 7;
      chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
      radix = chars.length;
      return ((function() {
        var _results;
        _results = [];
        for (i = 0; 0 <= len ? i < len : i > len; 0 <= len ? i++ : i--) {
          _results.push(chars[0 | Math.random() * radix]);
        }
        return _results;
      })()).join('');
    };

    Store.prototype._setObject = function(type, id, object) {
      var key, store;
      key = "" + type + "/" + id;
      store = $.extend({}, object);
      delete store.type;
      delete store.id;
      return this.db.setItem(key, JSON.stringify(store));
    };

    Store.prototype._getObject = function(type, id) {
      var json, key, obj;
      key = "" + type + "/" + id;
      json = this.db.getItem(key);
      if (json) {
        obj = JSON.parse(json);
        obj.type = type;
        obj.id = id;
        if (obj.created_at) obj.created_at = new Date(Date.parse(obj.created_at));
        if (obj.updated_at) obj.updated_at = new Date(Date.parse(obj.updated_at));
        if (obj._synced_at) obj._synced_at = new Date(Date.parse(obj._synced_at));
        return obj;
      } else {
        return false;
      }
    };

    Store.prototype._now = function() {
      return new Date;
    };

    Store.prototype._is_valid_key = function(key) {
      return /^[a-z0-9]+$/.test(key);
    };

    Store.prototype._is_semantic_id = function(key) {
      return /^[a-z0-9]+\/[a-z0-9]+$/.test(key);
    };

    Store.prototype._promise = $.Deferred;

    Store.prototype._cached = {};

    Store.prototype._dirty = {};

    Store.prototype._index = function() {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = this.db.length(); 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        _results.push(this.db.key(i));
      }
      return _results;
    };

    return Store;

  })();
});
