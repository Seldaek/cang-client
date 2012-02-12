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
    var _dirty_timeout;

    function Store(couch) {
      this.couch = couch;
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
      id || (id = this.couch.uuid());
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
      var def, object;
      def = this._deferred();
      if (!(typeof type === 'string' && typeof id === 'string')) {
        def.reject(INVALID_ARGUMENTS_ERROR("type & id are required"));
        return def;
      }
      try {
        object = this.cache(type, id);
        if (!object) {
          def.reject(NOT_FOUND_ERROR(type, id));
          return def;
        }
        object.id = id;
        object.type = type;
        def.resolve(object);
      } catch (error) {
        def.reject(error);
      }
      return def;
    };

    Store.prototype.getAll = function(type) {
      var def, id, key, keys, object, results, _type;
      def = this._deferred();
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
            object = this.cache(_type, id);
            object.id = id;
            object.type = _type;
            _results.push(object);
          }
          return _results;
        }).call(this);
        def.resolve(results);
      } catch (error) {
        def.reject(error);
      }
      return def;
    };

    Store.prototype.destroy = function(type, id) {
      var def, key, object;
      def = this._deferred();
      object = this.cache(type, id);
      if (object) {
        if (object._rev) {
          object._deleted = true;
          this.cache(type, id, object);
        } else {
          key = "" + type + "/" + id;
          this._removeItem(key);
          delete this._cached[key];
          this.clear_changed(type, id);
        }
        def.resolve(object);
      } else {
        def.reject(NOT_FOUND_ERROR(type, id));
      }
      return def;
    };

    Store.prototype.cache = function(type, id, value, options) {
      var json_string, key;
      if (value == null) value = false;
      if (options == null) options = {};
      key = "" + type + "/" + id;
      if (value) {
        this._cached[key] = value;
        this._setItem(key, JSON.stringify(value));
      } else {
        if (this._cached[key] != null) return this._cached[key];
        json_string = this._getItem(key);
        if (json_string) {
          this._cached[key] = JSON.parse(json_string);
        } else {
          this._cached[key] = false;
        }
      }
      if (options.remote) {
        this.clear_changed(type, id);
      } else {
        if (this.is_dirty(type, id) || this.is_marked_as_deleted(type, id)) {
          this.changed(type, id, this._cached[key]);
        } else {
          this.clear_changed(type, id);
        }
      }
      return this._cached[key];
    };

    Store.prototype.clear_changed = function(type, id) {
      var key;
      key = "" + type + "/" + id;
      if (key) {
        return delete this._dirty[key];
      } else {
        return this._dirty = {};
      }
    };

    Store.prototype.is_marked_as_deleted = function(type, id) {
      return this.cache(type, id)._deleted === true;
    };

    _dirty_timeout = null;

    Store.prototype.changed = function(type, id, value) {
      var key,
        _this = this;
      key = "" + type + "/" + id;
      if (value) {
        this._dirty[key] = value;
        window.clearTimeout(this._dirty_timeout);
        return this._dirty_timeout = window.setTimeout((function() {}), 2000);
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
      return this.cache(type, id).synced_at.getTime() + 100 < this.cache(type, id).updated_at.getTime();
    };

    Store.prototype.clear = function() {
      var def;
      def = this._deferred();
      try {
        this._clear();
        this._cached = {};
        this.clear_changed();
        def.resolve();
      } catch (error) {
        def.reject();
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

  this.couchApp = (function(_super) {

    __extends(couchApp, _super);

    function couchApp(couchDB_url) {
      this.couchDB_url = couchDB_url;
      this.couchDB_url = this.couchDB_url.replace(/\/+$/, '');
      this.store = new Store(this);
    }

    couchApp.prototype.uuid = function(len) {
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

    couchApp.prototype.sign_up = function(email, password) {
      var key, password_sha, prefix, salt, user;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      salt = hex_sha1(this.uuid());
      password_sha = hex_sha1(password + salt);
      user = {
        _id: key,
        name: email,
        type: 'user',
        roles: [],
        salt: salt,
        password_sha: password_sha
      };
      return $.ajax({
        type: 'PUT',
        url: "" + this.couchDB_url + "/_users/" + (encodeURIComponent(key)),
        data: JSON.stringify(user),
        contentType: "application/json"
      });
    };

    couchApp.prototype.sign_in = function(email, password) {
      var creds;
      creds = JSON.stringify({
        name: email,
        password: password
      });
      return $.ajax({
        type: 'POST',
        url: "" + this.couchDB_url + "/_session",
        data: creds,
        contentType: "application/json"
      });
    };

    couchApp.prototype.change_password = function(email) {
      return alert('change password is not yet implementd');
    };

    couchApp.prototype.sign_out = function() {
      return $.ajax({
        type: 'DELETE',
        url: "" + this.couchDB_url + "/_session",
        contentType: "application/json"
      });
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
