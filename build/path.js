(function() {
  var NAMES, PARSED, PathInfo, any, concatMap, copy, error, get, intermine, makeKey, set, success, utils, withCB,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  intermine = exports;

  utils = require('./util');

  withCB = utils.withCB, concatMap = utils.concatMap, get = utils.get, any = utils.any, set = utils.set, copy = utils.copy, success = utils.success, error = utils.error;

  NAMES = {};

  PARSED = {};

  makeKey = function(model, path, subclasses) {
    var k, ref, v;
    return (model != null ? model.name : void 0) + "|" + (model != null ? (ref = model.service) != null ? ref.root : void 0 : void 0) + "|" + path + ":" + ((function() {
      var results;
      results = [];
      for (k in subclasses) {
        v = subclasses[k];
        results.push(k + "=" + v);
      }
      return results;
    })());
  };

  PathInfo = (function() {
    function PathInfo(arg) {
      var i, ref;
      this.root = arg.root, this.model = arg.model, this.descriptors = arg.descriptors, this.subclasses = arg.subclasses, this.displayName = arg.displayName, this.ident = arg.ident;
      this.allDescriptors = bind(this.allDescriptors, this);
      this.getChildNodes = bind(this.getChildNodes, this);
      this.getDisplayName = bind(this.getDisplayName, this);
      this.isa = bind(this.isa, this);
      this.append = bind(this.append, this);
      this.getParent = bind(this.getParent, this);
      this.getEndClass = bind(this.getEndClass, this);
      this.containsCollection = bind(this.containsCollection, this);
      this.isCollection = bind(this.isCollection, this);
      this.isReverseReference = bind(this.isReverseReference, this);
      this.isReference = bind(this.isReference, this);
      this.isClass = bind(this.isClass, this);
      this.isAttribute = bind(this.isAttribute, this);
      this.isRoot = bind(this.isRoot, this);
      ref = this.descriptors, this.mid = 2 <= ref.length ? slice.call(ref, 0, i = ref.length - 1) : (i = 0, []), this.end = ref[i++];
      if (this.ident == null) {
        this.ident = makeKey(this.model, this, this.subclasses);
      }
    }

    PathInfo.prototype.isRoot = function() {
      return this.descriptors.length === 0;
    };

    PathInfo.prototype.isAttribute = function() {
      return (this.end != null) && !this.isReference();
    };

    PathInfo.prototype.isClass = function() {
      return this.isRoot() || this.isReference();
    };

    PathInfo.prototype.isReference = function() {
      var ref;
      return ((ref = this.end) != null ? ref.referencedType : void 0) != null;
    };

    PathInfo.prototype.isReverseReference = function() {
      var gp, p, ref, referencedType, reverseReference;
      if (this.isReference() && (this.mid.length > 0)) {
        ref = this.end, reverseReference = ref.reverseReference, referencedType = ref.referencedType;
        p = this.getParent();
        gp = p.getParent();
        return (referencedType != null) && (gp.isa(referencedType)) && (p.end.name === reverseReference);
      }
      return false;
    };

    PathInfo.prototype.isCollection = function() {
      var ref, ref1;
      return (ref = (ref1 = this.end) != null ? ref1.isCollection : void 0) != null ? ref : false;
    };

    PathInfo.prototype.containsCollection = function() {
      return any(this.descriptors, function(x) {
        return x.isCollection;
      });
    };

    PathInfo.prototype.getEndClass = function() {
      var ref;
      return this.model.classes[this.subclasses[this.toString()] || ((ref = this.end) != null ? ref.referencedType : void 0)] || this.root;
    };

    PathInfo.prototype.getParent = function() {
      var data;
      if (this.isRoot()) {
        throw new Error("Root paths do not have parents");
      }
      data = {
        root: this.root,
        model: this.model,
        descriptors: this.mid.slice(),
        subclasses: this.subclasses
      };
      return new PathInfo(data);
    };

    PathInfo.prototype.append = function(attr) {
      var data, fld;
      if (this.isAttribute()) {
        throw new Error(this + " is an attribute.");
      }
      fld = (typeof attr === 'string') ? this.getType().fields[attr] : attr;
      if (fld == null) {
        throw new Error(attr + " is not a field of " + (this.getType()));
      }
      data = {
        root: this.root,
        model: this.model,
        descriptors: this.descriptors.concat([fld]),
        subclasses: this.subclasses
      };
      return new PathInfo(data);
    };

    PathInfo.prototype.isa = function(clazz) {
      var name, type;
      if (clazz == null) {
        return false;
      }
      if (this.isAttribute()) {
        return this.getType() === clazz;
      } else {
        name = clazz.name ? clazz.name : '' + clazz;
        type = this.getType();
        return (name === type.name) || (indexOf.call(this.model.getAncestorsOf(type), name) >= 0);
      }
    };

    PathInfo.prototype.getDisplayName = function(cb) {
      var cached, custom, params, path;
      if (custom = this.displayName) {
        return success(custom);
      }
      if (this.namePromise == null) {
        this.namePromise = (cached = NAMES[this.ident]) ? success(cached) : this.isRoot() && this.root.displayName ? success(this.root.displayName) : this.model.service == null ? error("No service") : (path = 'model' + (concatMap(function(d) {
          return '/' + d.name;
        }))(this.allDescriptors()), params = (set({
          format: 'json'
        }))(copy(this.subclasses)), this.model.service.get(path, params).then(get('display')).then((function(_this) {
          return function(n) {
            var name1;
            return NAMES[name1 = _this.ident] != null ? NAMES[name1] : NAMES[name1] = n;
          };
        })(this)));
      }
      return withCB(cb, this.namePromise);
    };

    PathInfo.prototype.getChildNodes = function() {
      var fld, name, ref, ref1, results;
      ref1 = ((ref = this.getEndClass()) != null ? ref.fields : void 0) || {};
      results = [];
      for (name in ref1) {
        fld = ref1[name];
        results.push(this.append(fld));
      }
      return results;
    };

    PathInfo.prototype.allDescriptors = function() {
      return [this.root].concat(this.descriptors);
    };

    PathInfo.prototype.toString = function() {
      return this.allDescriptors().map(get('name')).join('.');
    };

    PathInfo.prototype.equals = function(other) {
      return this === other || (this.ident && (other != null ? other.ident : void 0) === this.ident);
    };

    PathInfo.prototype.getType = function() {
      var ref, ref1;
      return ((ref = this.end) != null ? (ref1 = ref.type) != null ? ref1.replace(/java\.lang\./, '') : void 0 : void 0) || this.getEndClass();
    };

    return PathInfo;

  })();

  PathInfo.prototype.toPathString = PathInfo.prototype.toString;

  PathInfo.parse = function(model, path, subclasses) {
    var cached, cd, descriptors, fld, ident, keyPath, part, parts, root;
    if (subclasses == null) {
      subclasses = {};
    }
    ident = makeKey(model, path, subclasses);
    if (cached = PARSED[ident]) {
      return cached;
    }
    parts = (path + '').split('.');
    root = cd = model.classes[parts.shift()];
    keyPath = root.name;
    descriptors = (function() {
      var i, len, ref, results;
      results = [];
      for (i = 0, len = parts.length; i < len; i++) {
        part = parts[i];
        fld = (cd != null ? cd.fields[part] : void 0) || ((ref = (cd = model.classes[subclasses[keyPath]])) != null ? ref.fields[part] : void 0);
        if (!fld) {
          throw new Error("Could not find " + part + " in " + cd + " when parsing " + path);
        }
        keyPath += "." + part;
        cd = model.classes[fld.type || fld.referencedType];
        results.push(fld);
      }
      return results;
    })();
    return PARSED[ident] = new PathInfo({
      root: root,
      model: model,
      descriptors: descriptors,
      subclasses: subclasses,
      ident: ident
    });
  };

  PathInfo.flushCache = function() {
    PARSED = {};
    return NAMES = {};
  };

  intermine.PathInfo = PathInfo;

}).call(this);
