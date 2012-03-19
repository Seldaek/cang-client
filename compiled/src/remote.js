var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('remote', ['errors'], function(ERROR) {
  'use strict';
  var Remote;
  return Remote = (function() {

    function Remote(app) {
      this.app = app;
      this._handle_push_changes = __bind(this._handle_push_changes, this);
      this._handle_pull_changes = __bind(this._handle_pull_changes, this);
      this._changes_error = __bind(this._changes_error, this);
      this._changes_success = __bind(this._changes_success, this);
      this._restart_changes_request = __bind(this._restart_changes_request, this);
      this.push_changes = __bind(this.push_changes, this);
      this.pull_changes = __bind(this.pull_changes, this);
      this.disconnect = __bind(this.disconnect, this);
      this.connect = __bind(this.connect, this);
      this.app.on('account:signed_in', this.connect);
      this.app.on('account:signed_out', this.disconnect);
      this.connect();
    }

    Remote.prototype.connect = function() {
      var _this = this;
      if (this._connected) return;
      return this.app.account.authenticate().done(function() {
        _this.app.on('store:dirty:idle', _this.push_changes);
        _this.pull_changes();
        return _this.push_changes();
      });
    };

    Remote.prototype.disconnect = function() {
      this._connected = false;
      console.log('aborting _changes_request', this._changes_request);
      if (this._changes_request) this._changes_request.abort();
      this.app.store.db.removeItem('_couch.remote.seq');
      this.app.unbind('store:dirty:idle', this.push_changes);
      return delete this._seq;
    };

    Remote.prototype.pull_changes = function() {
      this._connected = true;
      this._changes_request = this.app.request('GET', this._changes_path(), {
        success: this._changes_success,
        error: this._changes_error
      });
      window.clearTimeout(this._changes_request_timeout);
      return this._changes_request_timeout = window.setTimeout(this._restart_changes_request, 25000);
    };

    Remote.prototype.push_changes = function(options) {
      var doc, docs;
      docs = this.app.store.changed_docs();
      if (docs.length === 0) return this._promise().resolve([]);
      docs = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          _results.push(this._parse_for_remote(doc));
        }
        return _results;
      }).call(this);
      return this.app.request('POST', "/" + (encodeURIComponent(this.app.account.email)) + "/_bulk_docs", {
        dataType: 'json',
        processData: false,
        contentType: 'application/json',
        data: JSON.stringify({
          docs: docs
        }),
        success: this._handle_push_changes
      });
    };

    Remote.prototype.get_seq = function() {
      return this._seq || (this._seq = this.app.store.db.getItem('_couch.remote.seq') || 0);
    };

    Remote.prototype.set_seq = function(seq) {
      return this._seq = this.app.store.db.setItem('_couch.remote.seq', seq);
    };

    Remote.prototype.on = function(event, cb) {
      return this.app.on("remote:" + event, cb);
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
      this._handle_pull_changes(response.results);
      return this.pull_changes();
    };

    Remote.prototype._changes_error = function(xhr, error, resp) {
      if (!this._connected) return;
      switch (xhr.status) {
        case 403:
          this.trigger('error:unauthorized');
          return this.disconnect();
        case 404:
          return window.setTimeout(this.pull_changes, 3000);
        case 500:
          this.trigger('error:server');
          return this.disconnect();
        default:
          if (xhr.statusText === 'abort') {
            return this.pull_changes();
          } else {
            return window.setTimeout(this.pull_changes, 3000);
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

    Remote.prototype._handle_pull_changes = function(changes) {
      var doc, _doc, _i, _len, _results,
        _this = this;
      _results = [];
      for (_i = 0, _len = changes.length; _i < _len; _i++) {
        doc = changes[_i].doc;
        _doc = this._parse_from_remote(doc);
        if (_doc._deleted) {
          _results.push(this.app.store.destroy(_doc.type, _doc.id, {
            remote: true
          }).done(function(object) {
            _this.app.trigger('remote:destroyed', _doc.type, _doc.id, object);
            _this.app.trigger("remote:destroyed:" + _doc.type, _doc.id, object);
            _this.app.trigger('remote:changed', _doc.type, _doc.id, object);
            return _this.app.trigger("remote:changed:" + _doc.type, _doc.id, object);
          }));
        } else {
          _results.push(this.app.store.save(_doc.type, _doc.id, _doc, {
            remote: true
          }).done(function(object, object_was_created) {
            _this.app.trigger('remote:changed', _doc.type, _doc.id, object);
            _this.app.trigger("remote:changed:" + _doc.type, _doc.id, object);
            if (object_was_created) {
              _this.app.trigger('remote:created', _doc.type, _doc.id, object);
              return _this.app.trigger("remote:created:" + _doc.type, _doc.id, object);
            } else {
              _this.app.trigger('remote:updated', _doc.type, _doc.id, object);
              return _this.app.trigger("remote:updated:" + _doc.type, _doc.id, object);
            }
          }));
        }
      }
      return _results;
    };

    Remote.prototype._handle_push_changes = function(changes) {};

    Remote.prototype._promise = $.Deferred;

    return Remote;

  })();
});
