
define('store', ['events', 'errors'], function(Events, ERROR) {
  'use strict';
  var Store;
  return Store = (function() {

    function Store(app) {
      this.app = app;
      if (!this.is_persistent()) {
        this._getItem = function() {
          return null;
        };
        this._setItem = function() {
          return null;
        };
        this._removeItem = function() {
          return null;
        };
        this._key = function() {
          return null;
        };
        this._length = function() {
          return 0;
        };
        this._clear = function() {
          return null;
        };
      }
    }

    Store.prototype.save = function(type, id, object) {
      var promise;
      promise = this._deferred();
      switch (arguments.length) {
        case 2:
          object = id;
          id = object.id;
          break;
        case 1:
          object = type;
          type = object.type;
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
      object.created_at || (object.created_at = object.updated_at = this._now());
      delete object.id;
      delete object.type;
      try {
        object = this.cache(type, id, object);
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
      promise = this._deferred();
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
      promise = this._deferred();
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
      promise = this._deferred();
      object = this.cache(type, id);
      if (!object) return promise.reject(ERROR.NOT_FOUND(type, id));
      if (object._rev) {
        object._deleted = true;
        this.cache(type, id, object);
      } else {
        key = "" + type + "/" + id;
        this._removeItem(key);
        delete this._cached[key];
        this.clear_changed(type, id);
      }
      return promise.resolve(object);
    };

    Store.prototype["delete"] = Store.prototype.destroy;

    Store.prototype.cache = function(type, id, update, options) {
      var json_string, key;
      if (update == null) update = false;
      if (options == null) options = {};
      key = "" + type + "/" + id;
      if (update) {
        this._cached[key] = update;
        delete update.type;
        delete update.id;
        this._setItem(key, JSON.stringify(update));
        if (options.remote) {
          this.clear_changed(type, id);
          return update;
        }
      } else {
        if (this._cached[key] != null) return this._cached[key];
        json_string = this._getItem(key);
        if (json_string) {
          this._cached[key] = JSON.parse(json_string);
        } else {
          this._cached[key] = false;
        }
      }
      if (this.is_dirty(type, id) || this.is_marked_as_deleted(type, id)) {
        this.changed(type, id, this._cached[key]);
      } else {
        this.clear_changed(type, id);
      }
      this._cached[key].type = type;
      this._cached[key].id = id;
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
      return this.cache(type, id)._deleted === true;
    };

    Store.prototype.changed = function(type, id, object) {
      var key,
        _this = this;
      key = "" + type + "/" + id;
      if (object) {
        this._dirty[key] = object;
        window.clearTimeout(this._dirty_timeout);
        return this._dirty_timeout = window.setTimeout((function() {
          return _this.app.trigger('store:dirty:idle');
        }), 2000);
      } else {
        if (arguments.length) {
          return this._dirty[key];
        } else {
          return this._dirty;
        }
      }
    };

    Store.prototype.is_dirty = function(type, id) {
      var key;
      if (type == null) type = null;
      if (id == null) id = null;
      if (!type) return _(this._dirty).keys().length > 0;
      key = "" + type + "/" + id;
      if (!this.cache(type, id).synced_at) return true;
      if (!this.cache(type, id).updated_at) return false;
      if (!(this.cache(type, id).synced_at instanceof Date)) {
        this.cache(type, id).synced_at = Date.parse(this.cache(type, id).synced_at);
      }
      if (!(this.cache(type, id).updated_at instanceof Date)) {
        this.cache(type, id).updated_at = Date.parse(this.cache(type, id).updated_at);
      }
      return this.cache(type, id).synced_at.getTime() < this.cache(type, id).updated_at.getTime();
    };

    Store.prototype.clear = function() {
      var promise;
      promise = this._deferred();
      try {
        this._clear();
        this._cached = {};
        this.clear_changed();
        promise.resolve();
      } catch (error) {
        promise.reject();
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

    Store.prototype._getItem = function(key) {
      return window.localStorage.getItem(key);
    };

    Store.prototype._setItem = function(key, value) {
      return window.localStorage.setItem(key, value);
    };

    Store.prototype._removeItem = function(key) {
      return window.localStorage.removeItem(key);
    };

    Store.prototype._key = function(nr) {
      return window.localStorage.key(nr);
    };

    Store.prototype._length = function() {
      return window.localStorage.length;
    };

    Store.prototype._clear = function() {
      return window.localStorage.clear();
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

    Store.prototype._deferred = $.Deferred;

    Store.prototype._cached = {};

    Store.prototype._dirty = {};

    Store.prototype._index = function() {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = this._length(); 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        _results.push(this._key(i));
      }
      return _results;
    };

    return Store;

  })();
});
