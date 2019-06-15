(function() {
  var JAVA_LANG_OBJ, Model, PathInfo, Table, error, find, flatten, intermine, omap, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Table = require('./table').Table;

  PathInfo = require('./path').PathInfo;

  ref = require('./util'), flatten = ref.flatten, find = ref.find, error = ref.error, omap = ref.omap;

  intermine = exports;

  JAVA_LANG_OBJ = new Table({
    name: 'Object',
    tags: [],
    displayName: 'Object',
    attributes: {},
    references: {},
    collections: {}
  });

  Model = (function() {
    function Model(arg) {
      var classes, liftToTable;
      this.name = arg.name, classes = arg.classes;
      this.findCommonType = bind(this.findCommonType, this);
      this.findSharedAncestor = bind(this.findSharedAncestor, this);
      this.getAncestorsOf = bind(this.getAncestorsOf, this);
      this.getSubclassesOf = bind(this.getSubclassesOf, this);
      this.getPathInfo = bind(this.getPathInfo, this);
      liftToTable = omap((function(_this) {
        return function(k, v) {
          return [k, new Table(v, _this)];
        };
      })(this));
      this.classes = liftToTable(classes);
      this.classes['java.lang.Object'] = JAVA_LANG_OBJ;
    }

    Model.prototype.getPathInfo = function(path, subcls) {
      return PathInfo.parse(this, path, subcls);
    };

    Model.prototype.getSubclassesOf = function(cls) {
      var _, cd, clazz, ref1, ref2, ret;
      clazz = (cls && cls.name) ? cls : this.classes[cls];
      if (clazz == null) {
        throw new Error(cls + " is not a table");
      }
      ret = [clazz.name];
      ref1 = this.classes;
      for (_ in ref1) {
        cd = ref1[_];
        if (ref2 = clazz.name, indexOf.call(cd.parents(), ref2) >= 0) {
          ret = ret.concat(this.getSubclassesOf(cd));
        }
      }
      return ret;
    };

    Model.prototype.getAncestorsOf = function(cls) {
      var clazz, parents;
      clazz = (cls && cls.name) ? cls : this.classes[cls];
      if (clazz == null) {
        throw new Error(cls + " is not a table");
      }
      parents = clazz.parents();
      return parents.filter((function(_this) {
        return function(p) {
          return _this.classes[p];
        };
      })(this)).reduce(((function(_this) {
        return function(as, p) {
          return as.concat(_this.getAncestorsOf(p));
        };
      })(this)), parents);
    };

    Model.prototype.findSharedAncestor = function(classA, classB) {
      var a_ancestry, b_ancestry, firstCommon;
      if (classB === null || classA === null) {
        return null;
      }
      if (classA === classB) {
        return classA;
      }
      a_ancestry = this.getAncestorsOf(classA);
      if (indexOf.call(a_ancestry, classB) >= 0) {
        return classB;
      }
      b_ancestry = this.getAncestorsOf(classB);
      if (indexOf.call(b_ancestry, classA) >= 0) {
        return classA;
      }
      firstCommon = find(a_ancestry, function(a) {
        return indexOf.call(b_ancestry, a) >= 0;
      });
      return firstCommon;
    };

    Model.prototype.findCommonType = function(xs) {
      if (xs == null) {
        xs = [];
      }
      return xs.reduce(this.findSharedAncestor);
    };

    return Model;

  })();

  Model.prototype.makePath = Model.prototype.getPathInfo;

  Model.prototype.findCommonTypeOfMultipleClasses = Model.prototype.findCommonType;

  Model.load = function(data) {
    var e;
    try {
      return new Model(data);
    } catch (error1) {
      e = error1;
      throw new Error("Error loading model: " + e);
    }
  };

  Model.INTEGRAL_TYPES = ["int", "Integer", "long", "Long"];

  Model.FRACTIONAL_TYPES = ["double", "Double", "float", "Float"];

  Model.NUMERIC_TYPES = Model.INTEGRAL_TYPES.concat(Model.FRACTIONAL_TYPES);

  Model.BOOLEAN_TYPES = ["boolean", "Boolean"];

  intermine.Model = Model;

}).call(this);
