var _and, _but, _when;

_when = function(description, specs) {
  return describe("when " + description, specs);
};

_and = function(description, specs) {
  return describe("and " + description, specs);
};

_but = function(description, specs) {
  return describe("but " + description, specs);
};
