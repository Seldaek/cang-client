var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('remote', ['errors'], function(ERROR) {
  'use strict';
  var Remote;
  return Remote = (function() {

    function Remote(app) {
      this.app = app;
      this._handle_changes = __bind(this._handle_changes, this);
      this._restart_changes_request = __bind(this._restart_changes_request, this);
      this.push_changes = __bind(this.push_changes, this);
      this.app.on('store:dirty:idle', this.push_changes);
    }

    Remote.prototype.connect = function() {
      if (this._connected) return;
      return this.pull_changes();
    };

    Remote.prototype.disconnect = function() {
      this._connected = false;
      if (this._changes_request) return this._changes_request.abort();
    };

    Remote.prototype.pull_changes = function() {
      this._connected = true;
      this._changes_request = $.ajax({
        type: 'GET',
        dataType: 'json',
        processData: false,
        url: this._changes_url(),
        contentType: 'application/json',
        success: this._changes_success,
        error: this._changes_error
      });
      window.clearTimeout(this._changes_request_timeout);
      return this._changes_request_timeout = window.setTimeout(this._restart_changes_request, 59000);
    };

    Remote.prototype.push_changes = function(options) {
      var doc, docs, params, _i, _len;
      docs = this.app.store.changed_docs();
      if (docs.lenght === 0) return this._deferred().resolve([]);
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        docs = this._parse_for_remote(doc);
      }
      params = {
        type: 'POST',
        dataType: 'json',
        url: "/db/account/_bulk_docs",
        contentType: 'application/json',
        data: JSON.stringify({
          docs: docs
        }),
        success: this._handle_changes
      };
      return $.ajax(params);
    };

    Remote.prototype.get_seq = function() {
      return this._seq || (this._seq = this.store.db.getItem('_couch.remote.seq') || 0);
    };

    Remote.prototype.set_seq = function(seq) {
      return this._seq = this.store.db.setItem('_couch.remote.seq', seq);
    };

    Remote.prototype._changes_url = function() {
      var db, since;
      since = this.get_seq();
      db = 'joe_example_com';
      return "/" + db + "/_changes?heartbeat=10000&feed=longpoll&since=" + since;
    };

    Remote.prototype._restart_changes_request = function() {
      var _ref;
      return (_ref = this._changes_request) != null ? _ref.abort() : void 0;
    };

    Remote.prototype._changes_success = function(response) {
      if (!this._connected) return;
      this._handle_changes(response);
      return this.pull_changes();
    };

    Remote.prototype._changes_error = function(xhr, error, resp) {
      var _this = this;
      if (!this.is_active()) return;
      if (this.is_offline()) return;
      switch (xhr.status) {
        case 403:
          this.trigger('error:unauthorized');
          return this.stop();
        case 404:
          return window.setTimeout((function() {
            return _this._getChanges();
          }), this._changes_timeout(3000));
        case 500:
          this.trigger('error:server');
          return this.stop();
        default:
          if (xhr.statusText === 'abort') {
            return this._getChanges();
          } else {
            if (App.AutoUpdate.status() !== 'checking') App.AutoUpdate.check();
            window.setTimeout((function() {
              return _this._getChanges();
            }), this._changes_timeout());
            return this._double_changes_timeout();
          }
      }
    };

    _changes_error;

    Remote.prototype._valid_special_attributes = {
      '_id': 1,
      '_rev': 1,
      '_deleted': 1
    };

    Remote.prototype._parse_for_remote = function(obj) {
      var attr, attributes;
      attributes = $.extend(obj);
      for (attr in attributes) {
        if (this._valid_special_attributes[attr]) next;
        if (!/^_/.test(attr)) next;
        delete attributes[attr];
      }
      return attributes;
    };

    Remote.prototype._handle_changes = function(response) {
      var object, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = response.length; _i < _len; _i++) {
        object = response[_i];
        _results.push(this.app.store(object, {
          remote: true
        }));
      }
      return _results;
    };

    Remote.prototype._deferred = $.Deferred;

    return Remote;

  })();
});
