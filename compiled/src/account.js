
define('account', function() {
  'use strict';
  var Account;
  return Account = (function() {

    function Account(app) {
      this.app = app;
    }

    Account.prototype.sign_up = function(email, password) {
      var key, prefix, user;
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      user = {
        _id: key,
        name: email,
        type: 'user',
        roles: [],
        password: password
      };
      return $.ajax({
        type: 'PUT',
        url: "" + this.app.couchDB_url + "/_users/" + (encodeURIComponent(key)),
        data: JSON.stringify(user),
        contentType: "application/json"
      });
    };

    Account.prototype.sign_in = function(email, password) {
      var creds;
      creds = JSON.stringify({
        name: email,
        password: password
      });
      return $.ajax({
        type: 'POST',
        url: "" + this.app.couchDB_url + "/_session",
        data: creds,
        contentType: "application/json"
      });
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      return alert('change password is not yet implementd');
    };

    Account.prototype.sign_out = function() {
      return $.ajax({
        type: 'DELETE',
        url: "" + this.app.couchDB_url + "/_session",
        contentType: "application/json"
      });
    };

    Account.prototype.logout = Account.prototype.sign_out;

    return Account;

  })();
});
