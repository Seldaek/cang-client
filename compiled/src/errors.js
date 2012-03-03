
define("errors", function() {
  'use strict';
  var errors;
  return errors = {
    INVALID_KEY: function(id_or_type) {
      var key;
      key = id_or_type.id ? 'id' : 'type';
      return new Error("invalid " + key + " '" + id_or_type[key] + "': numbers and lowercase letters allowed only");
    },
    INVALID_ARGUMENTS: function(msg) {
      return new Error(msg);
    },
    NOT_FOUND: function(type, id) {
      return new Error("" + type + " with " + id + " could not be found");
    }
  };
});
