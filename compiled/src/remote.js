var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('remote', ['errors'], function(ERROR) {
  'use strict';
  var Remote;
  Remote = (function() {

    function Remote(app) {
      this.app = app;
      this.push_changes = __bind(this.push_changes, this);
      this.app.on('store:dirty:idle', this.push_changes);
    }

    Remote.prototype.listen_to_changes = function() {};

    Remote.prototype.push_changes = function(options) {
      var doc, docs, params, promise, _i, _len,
        _this = this;
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
        })
      };
      promise = $.ajax(params);
      return promise.done(function(response) {
        var object, _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = response.length; _j < _len2; _j++) {
          object = response[_j];
          _results.push(_this.app.store(object, {
            remote: true
          }));
        }
        return _results;
      });
    };

    return Remote;

  })();
  return {
    _valid_special_attributes: {
      '_id': 1,
      '_rev': 1,
      '_deleted': 1
    },
    _parse_for_remote: function(obj) {
      var attr, attributes;
      attributes = $.extend(obj);
      for (attr in attributes) {
        if (this._valid_special_attributes[attr]) next;
        if (!/^_/.test(attr)) next;
        delete attributes[attr];
      }
      return attributes;
    },
    _deferred: $.Deferred
  };
});
