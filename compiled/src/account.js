var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = Array.prototype.slice;

define('account', function() {
  'use strict';
  var Account;
  return Account = (function() {

    Account.prototype.email = void 0;

    function Account(app) {
      this.app = app;
      this._handle_sign_out = __bind(this._handle_sign_out, this);
      this._handle_sign_in = __bind(this._handle_sign_in, this);
      this.email = this.app.store.db.getItem('_couch.account.email');
      this.authenticate();
      this.app.on('account:signed_in', this._handle_sign_in);
      this.app.on('account:signed_out', this._handle_sign_out);
    }

    Account.prototype.authenticate = function() {
      var promise,
        _this = this;
      promise = this.app.promise();
      if (!this.email) return promise.reject();
      if (this._authenticated === true) return promise.resolve(this.email);
      if (this._authenticated === false) return promise.reject();
      this.app.request('GET', "/_session", {
        success: function(response) {
          if (response.userCtx.name) {
            _this._authenticated = true;
            _this.email = response.userCtx.name;
            return promise.resolve(_this.email);
          } else {
            _this._authenticated = false;
            _this.app.trigger('account:error:not_authenticated');
            return promise.reject();
          }
        },
        error: promise.reject
      });
      return promise;
    };

    Account.prototype.sign_up = function(email, password) {
      var key, prefix,
        _this = this;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      return this.app.request('PUT', "/_users/" + (encodeURIComponent(key)), {
        data: JSON.stringify({
          _id: key,
          name: email,
          type: 'user',
          roles: [],
          password: password
        }),
        contentType: 'application/json',
        success: function() {
          var _ref, _ref2;
          (_ref = _this.app).trigger.apply(_ref, ['account:signed_up'].concat(__slice.call(arguments)));
          return (_ref2 = _this.app).trigger.apply(_ref2, ['account:signed_in'].concat(__slice.call(arguments)));
        }
      });
    };

    Account.prototype.sign_in = function(email, password) {
      var _this = this;
      return this.app.request('POST', '/_session', {
        data: {
          name: email,
          password: password
        },
        success: function() {
          var _ref;
          return (_ref = _this.app).trigger.apply(_ref, ['account:signed_in'].concat(__slice.call(arguments)));
        }
      });
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      return alert('change password is not yet implementd');
    };

    Account.prototype.sign_out = function() {
      var _this = this;
      return this.app.request('DELETE', '/_session', {
        success: function() {
          var _ref;
          return (_ref = _this.app).trigger.apply(_ref, ['account:signed_out'].concat(__slice.call(arguments)));
        }
      });
    };

    Account.prototype.logout = Account.prototype.sign_out;

    Account.prototype._handle_sign_in = function(response) {
      this.email = response.name;
      this.app.store.db.setItem('_couch.account.email', this.email);
      return this._authenticated = true;
    };

    Account.prototype._handle_sign_out = function(response) {
      delete this.email;
      this.app.store.db.removeItem('_couch.account.email');
      return this._authenticated = false;
    };

    return Account;

  })();
});
