(function() {
  var Events, INVALID_ARGUMENTS_ERROR, INVALID_KEY_ERROR, NOT_FOUND_ERROR, Store,
    __slice = Array.prototype.slice,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Events = {
    bind: function(ev, callback) {
      var calls, evs, name, _i, _len;
      evs = ev.split(' ');
      calls = this.hasOwnProperty('_callbacks') && this._callbacks || (this._callbacks = {});
      for (_i = 0, _len = evs.length; _i < _len; _i++) {
        name = evs[_i];
        calls[name] || (calls[name] = []);
        calls[name].push(callback);
      }
      return this;
    },
    one: function(ev, callback) {
      return this.bind(ev, function() {
        this.unbind(ev, arguments.callee);
        return callback.apply(this, arguments);
      });
    },
    trigger: function() {
      var args, callback, ev, list, _i, _len, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      ev = args.shift();
      list = this.hasOwnProperty('_callbacks') && ((_ref = this._callbacks) != null ? _ref[ev] : void 0);
      if (!list) return;
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        callback = list[_i];
        if (callback.apply(this, args) === false) break;
      }
      return true;
    },
    unbind: function(ev, callback) {
      var cb, i, list, _len, _ref;
      if (!ev) {
        this._callbacks = {};
        return this;
      }
      list = (_ref = this._callbacks) != null ? _ref[ev] : void 0;
      if (!list) return this;
      if (!callback) {
        delete this._callbacks[ev];
        return this;
      }
      for (i = 0, _len = list.length; i < _len; i++) {
        cb = list[i];
        if (!(cb === callback)) continue;
        list = list.slice();
        list.splice(i, 1);
        this._callbacks[ev] = list;
        break;
      }
      return this;
    }
  };

  Store = (function() {

    function Store() {
      if (!this.supports_local_storage()) {
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

    Store.prototype.save = function(type, id, object) {
      var def, key;
      def = this._deferred();
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
        def.reject(INVALID_ARGUMENTS_ERROR("object is " + (typeof object)));
        return def;
      }
      id || (id = this.uuid());
      if (!this._is_valid_key(id)) {
        def.reject(INVALID_KEY_ERROR({
          id: id
        }));
        return def;
      }
      if (!this._is_valid_key(type)) {
        def.reject(INVALID_KEY_ERROR({
          type: type
        }));
        return def;
      }
      key = "" + type + "/" + id;
      object.created_at || (object.created_at = object.updated_at = this._now());
      delete object.id;
      delete object.type;
      try {
        this._setItem(key, JSON.stringify(object));
        object.id = id;
        object.type = type;
        def.resolve(object);
      } catch (error) {
        def.reject(error);
      }
      return def;
    };

    Store.prototype.get = function(type, id) {
      var data, def, key, object;
      def = this._deferred();
      if (!(typeof type === 'string' && typeof id === 'string')) {
        def.reject(INVALID_ARGUMENTS_ERROR("type & id are required"));
        return def;
      }
      key = "" + type + "/" + id;
      try {
        data = this._getItem(key);
        if (!data) {
          def.reject(NOT_FOUND_ERROR(type, id));
          return def;
        }
        object = JSON.parse(data);
        object.id = id;
        object.type = type;
        def.resolve(object);
      } catch (error) {
        def.reject(error);
      }
      return def;
    };

    Store.prototype.supports_local_storage = function() {
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

    Store.prototype._deferred = $.Deferred;

    return Store;

  })();

  this.couchApp = (function(_super) {

    __extends(couchApp, _super);

    function couchApp(couchDB_url) {
      this.store = new Store(couchDB_url);
    }

    couchApp.prototype.uuid = function(len) {
      return this.store.uuid(len);
    };

    return couchApp;

  })(Events);

  INVALID_KEY_ERROR = function(id_or_type) {
    var key;
    key = id_or_type.id ? 'id' : 'type';
    return new Error("invalid " + key + " '" + id_or_type[key] + "': numbers and lowercase letters allowed only");
  };

  INVALID_ARGUMENTS_ERROR = function(msg) {
    return new Error(msg);
  };

  NOT_FOUND_ERROR = function(type, id) {
    return new Error("" + type + " with " + id + " could not be found");
  };

}).call(this);
