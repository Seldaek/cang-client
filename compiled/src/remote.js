var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('remote', ['errors'], function(ERROR) {
  'use strict';
  var Remote;
  return Remote = (function() {

    function Remote(app) {
      this.app = app;
      this._handle_changes = __bind(this._handle_changes, this);
      this.push_changes = __bind(this.push_changes, this);
      this.app.on('store:dirty:idle', this.push_changes);
      this.app.on('remote:change', this._handle_changes);
    }

    Remote.prototype.listen_to_changes = function() {};

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
      return 0;
    };

    Remote.prototype.set_seq = function() {
      return null;
    };

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
