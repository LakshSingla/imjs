(function() {
  var Promise, merge, properties,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  merge = function(src, dest) {
    var k, results, v;
    results = [];
    for (k in src) {
      v = src[k];
      results.push(dest[k] = v);
    }
    return results;
  };

  Promise = require('./promise');

  properties = ['attributes', 'references', 'collections'];

  exports.Table = (function() {
    function Table(opts, model) {
      var _, c, i, len, prop, ref, ref1;
      this.model = model;
      this.getDisplayName = bind(this.getDisplayName, this);
      this.name = opts.name, this.tags = opts.tags, this.displayName = opts.displayName, this.attributes = opts.attributes, this.references = opts.references, this.collections = opts.collections;
      this.fields = {};
      this.__parents__ = (ref = opts['extends']) != null ? ref : [];
      for (i = 0, len = properties.length; i < len; i++) {
        prop = properties[i];
        if (this[prop] == null) {
          throw new Error("Bad model data: missing " + prop);
        }
        merge(this[prop], this.fields);
      }
      ref1 = this.collections;
      for (_ in ref1) {
        c = ref1[_];
        c.isCollection = true;
      }
    }

    Table.prototype.toString = function() {
      var _, n;
      return "[Table name=" + this.name + ", fields=[" + ((function() {
        var ref, results;
        ref = this.fields;
        results = [];
        for (n in ref) {
          _ = ref[n];
          results.push(n);
        }
        return results;
      }).call(this)) + "]]";
    };

    Table.prototype.parents = function() {
      var ref;
      return ((ref = this.__parents__) != null ? ref : []).slice();
    };

    Table.prototype.getDisplayName = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          if (_this.model != null) {
            return resolve(_this.model.makePath(_this.name).getDisplayName());
          } else {
            return reject(new Error('model not set - cannot make path'));
          }
        };
      })(this));
    };

    return Table;

  })();

}).call(this);
