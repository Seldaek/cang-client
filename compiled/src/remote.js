var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('remote', ['errors'], function(ERROR) {
  'use strict';
  var Remote;
  return Remote = (function() {

    function Remote(app) {
      this.app = app;
      this._handle_changes = __bind(this._handle_changes, this);
      this._changes_error = __bind(this._changes_error, this);
      this._changes_success = __bind(this._changes_success, this);
      this._restart_changes_request = __bind(this._restart_changes_request, this);
      this.push_changes = __bind(this.push_changes, this);
      this.pull_changes = __bind(this.pull_changes, this);
      this.disconnect = __bind(this.disconnect, this);
      this.connect = __bind(this.connect, this);
      this.app.on('store:dirty:idle', this.push_changes);
      this.connect();
      this.app.on('account:sign_in', this.connect);
      this.app.on('account:sign_out', this.disconnect);
    }

    Remote.prototype.connect = function() {
      if (this._connected) return;
      return this.app.account.authenticate().done(this.pull_changes);
    };

    Remote.prototype.disconnect = function() {
      this._connected = false;
      if (this._changes_request) this._changes_request.abort();
      this.app.store.db.removeItem('_couch.remote.seq');
      return delete this._seq;
    };

    Remote.prototype.pull_changes = function() {
      this._connected = true;
      this._changes_request = this.app.request('GET', this._changes_path(), {
        success: this._changes_success,
        error: this._changes_error
      });
      window.clearTimeout(this._changes_request_timeout);
      return this._changes_request_timeout = window.setTimeout(this._restart_changes_request, 59000);
    };

    Remote.prototype.push_changes = function(options) {
      var doc, docs;
      console.log("@app.store.changed_docs()", this.app.store.changed_docs());
      docs = this.app.store.changed_docs();
      if (docs.lenght === 0) return this._promise().resolve([]);
      docs = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          _results.push(this._parse_for_remote(doc));
        }
        return _results;
      }).call(this);
      console.log('POST', "/" + (encodeURIComponent(this.app.account.email)) + "/_bulk_docs", docs);
      return this.app.request('POST', "/" + (encodeURIComponent(this.app.account.email)) + "/_bulk_docs", {
        dataType: 'json',
        processData: false,
        contentType: 'application/json',
        data: JSON.stringify({
          docs: docs
        }),
        success: this._handle_changes
      });
    };

    Remote.prototype.get_seq = function() {
      return this._seq || (this._seq = this.app.store.db.getItem('_couch.remote.seq') || 0);
    };

    Remote.prototype.set_seq = function(seq) {
      return this._seq = this.app.store.db.setItem('_couch.remote.seq', seq);
    };

    Remote.prototype._changes_path = function() {
      var db, since;
      since = this.get_seq();
      db = 'joe_example_com';
      return "/" + (encodeURIComponent(this.app.account.email)) + "/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=" + since;
    };

    Remote.prototype._restart_changes_request = function() {
      var _ref;
      return (_ref = this._changes_request) != null ? _ref.abort() : void 0;
    };

    Remote.prototype._changes_success = function(response) {
      if (!this._connected) return;
      this.set_seq(response.last_seq);
      this._handle_changes(response.results);
      return this.pull_changes();
    };

    Remote.prototype._changes_error = function(xhr, error, resp) {
      if (!this._connected) return;
      switch (xhr.status) {
        case 403:
          this.trigger('error:unauthorized');
          return this.stop();
        case 404:
          return window.setTimeout(this.pull_changes, this._changes_timeout(3000));
        case 500:
          this.trigger('error:server');
          return this.stop();
        default:
          if (xhr.statusText === 'abort') {
            return this.pull_changes();
          } else {
            window.setTimeout(this.pull_changes, this._changes_timeout());
            return this._double_changes_timeout();
          }
      }
    };

    Remote.prototype._valid_special_attributes = {
      '_id': 1,
      '_rev': 1,
      '_deleted': 1
    };

    Remote.prototype._parse_for_remote = function(obj) {
      var attr, attributes;
      attributes = $.extend({}, obj);
      for (attr in attributes) {
        if (this._valid_special_attributes[attr]) continue;
        if (!/^_/.test(attr)) continue;
        delete attributes[attr];
      }
      attributes._id = "" + attributes.type + "/" + attributes.id;
      delete attributes.id;
      return attributes;
    };

    Remote.prototype._parse_from_remote = function(obj) {
      var id, _ref;
      id = obj._id || obj.id;
      delete obj._id;
      _ref = id.split(/\//), obj.type = _ref[0], obj.id = _ref[1];
      if (obj.created_at) obj.created_at = new Date(Date.parse(obj.created_at));
      if (obj.updated_at) obj.updated_at = new Date(Date.parse(obj.updated_at));
      return obj;
    };

    Remote.prototype._handle_changes = function(changes) {
      var result, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = changes.length; _i < _len; _i++) {
        result = changes[_i];
        _results.push(this.app.store.save(this._parse_from_remote(result.doc || result), {
          remote: true
        }));
      }
      return _results;
    };

    Remote.prototype._changes_timeout_default = 100;

    Remote.prototype._changes_timeout_current = 100;

    Remote.prototype._changes_timeout = function(set) {
      if (set) {
        return this._changes_timeout_current = set;
      } else {
        return this._changes_timeout_current;
      }
    };

    Remote.prototype._reset_changes_timeout = function() {
      return this._changes_timeout_current = this._changes_timeout_default;
    };

    Remote.prototype._double_changes_timeout = function() {
      return this._changes_timeout_current = this._changes_timeout_current * 2;
    };

    Remote.prototype._promise = $.Deferred;

    return Remote;

  })();
});
