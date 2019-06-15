(function() {
  var BASIC_ATTRS, CODES, Events, LIST_PIPE, Query, REQUIRES_VERSION, RESULTS_METHODS, SIMPLE_ATTRS, _get_data_fetcher, bioUriArgs, conAttrs, conStr, conToJSON, conValStr, concatMap, copyCon, decapitate, didntRemove, f, filter, fn1, fold, get, get_canonical_op, headLess, id, idConStr, intermine, interpretConArray, interpretConstraint, invoke, l, len, len1, m, merge, mth, multiConStr, noUndefVals, noValueConStr, partition, ref1, removeIrrelevantSortOrders, simpleConStr, stringToSortOrder, stringifySortOrder, toQueryString, typeConStr, union, utils, withCB,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice,
    hasProp = {}.hasOwnProperty;

  Events = require('backbone-events-standalone');

  intermine = exports;

  intermine.xml = require('./xml');

  utils = require('./util');

  REQUIRES_VERSION = utils.REQUIRES_VERSION, withCB = utils.withCB, merge = utils.merge, filter = utils.filter, partition = utils.partition, fold = utils.fold, concatMap = utils.concatMap, id = utils.id, get = utils.get, invoke = utils.invoke;

  toQueryString = utils.querystring;

  get_canonical_op = function(orig) {
    var canonical;
    canonical = (orig != null ? orig.toLowerCase : void 0) != null ? Query.OP_DICT[orig.toLowerCase()] : null;
    if (!canonical) {
      throw new Error("Illegal constraint operator: " + orig);
    }
    return canonical;
  };

  BASIC_ATTRS = ['path', 'op', 'code'];

  SIMPLE_ATTRS = BASIC_ATTRS.concat(['value', 'extraValue']);

  RESULTS_METHODS = ['rowByRow', 'eachRow', 'recordByRecord', 'eachRecord', 'records', 'rows', 'table', 'tableRows', 'values'];

  LIST_PIPE = function(service) {
    return utils.compose(service.fetchList, get('listName'));
  };

  CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  decapitate = function(x) {
    if (x == null) {
      x = '';
    }
    return x.substr(x.indexOf('.'));
  };

  conValStr = function(v) {
    if (v != null) {
      return "<value>" + (utils.escape(v)) + "</value>";
    } else {
      return "<nullValue/>";
    }
  };

  conAttrs = function(c, names) {
    var k, v;
    return ((function() {
      var results;
      results = [];
      for (k in c) {
        v = c[k];
        if ((indexOf.call(names, k) >= 0)) {
          results.push(k + "=\"" + (utils.escape(v)) + "\" ");
        }
      }
      return results;
    })()).join('');
  };

  noValueConStr = function(c) {
    return "<constraint " + (conAttrs(c, BASIC_ATTRS)) + "/>";
  };

  typeConStr = function(c) {
    return "<constraint " + (conAttrs(c, ['path', 'type'])) + "/>";
  };

  simpleConStr = function(c) {
    return "<constraint " + (conAttrs(c, SIMPLE_ATTRS)) + "/>";
  };

  multiConStr = function(c) {
    return "<constraint " + (conAttrs(c, BASIC_ATTRS)) + ">" + (concatMap(conValStr)(c.values)) + "</constraint>";
  };

  idConStr = function(c) {
    return "<constraint " + (conAttrs(c, BASIC_ATTRS)) + "ids=\"" + (c.ids.join(',')) + "\"/>";
  };

  conStr = function(c) {
    var ref1;
    if (c.values != null) {
      return multiConStr(c);
    } else if (c.ids != null) {
      return idConStr(c);
    } else if (c.op == null) {
      return typeConStr(c);
    } else if (ref1 = c.op, indexOf.call(Query.NULL_OPS, ref1) >= 0) {
      return noValueConStr(c);
    } else {
      return simpleConStr(c);
    }
  };

  headLess = function(path) {
    return path.replace(/^[^\.]+\./, '');
  };

  copyCon = function(con) {
    var code, editable, extraValue, ids, op, path, switchable, switched, type, value, values;
    path = con.path, type = con.type, op = con.op, value = con.value, values = con.values, extraValue = con.extraValue, ids = con.ids, code = con.code, editable = con.editable, switched = con.switched, switchable = con.switchable;
    ids = ids != null ? ids.slice() : void 0;
    values = values != null ? values.slice() : void 0;
    return noUndefVals({
      path: path,
      type: type,
      op: op,
      value: value,
      values: values,
      extraValue: extraValue,
      ids: ids,
      code: code,
      editable: editable,
      switched: switched,
      switchable: switchable
    });
  };

  conToJSON = function(con) {
    var copy;
    copy = copyCon(con);
    copy.path = headLess(copy.path);
    return copy;
  };

  noUndefVals = function(x) {
    var k, v;
    for (k in x) {
      v = x[k];
      if (v == null) {
        delete x[k];
      }
    }
    return x;
  };

  didntRemove = function(orig, reduced) {
    return "Did not remove a single constraint. original = " + orig + ", reduced = " + reduced;
  };

  interpretConstraint = function(path, con) {
    var constraint, k, keys, ref1, ref2, v, x;
    constraint = {
      path: path
    };
    if (con === null) {
      constraint.op = 'IS NULL';
    } else if (utils.isArray(con)) {
      constraint.op = 'ONE OF';
      constraint.values = con;
    } else if ((ref1 = typeof con) === 'string' || ref1 === 'number' || ref1 === 'boolean') {
      if (ref2 = typeof con.toUpperCase === "function" ? con.toUpperCase() : void 0, indexOf.call(Query.NULL_OPS, ref2) >= 0) {
        constraint.op = con;
      } else {
        constraint.op = '=';
        constraint.value = con;
      }
    } else {
      keys = (function() {
        var results;
        results = [];
        for (k in con) {
          x = con[k];
          results.push(k);
        }
        return results;
      })();
      if (indexOf.call(keys, 'isa') >= 0) {
        if (utils.isArray(con.isa)) {
          constraint.op = k;
          constraint.values = con.isa;
        } else {
          constraint.type = con.isa;
        }
      } else {
        if (indexOf.call(keys, 'extraValue') >= 0) {
          constraint.extraValue = con.extraValue;
        }
        for (k in con) {
          v = con[k];
          if (!(k !== 'extraValue')) {
            continue;
          }
          constraint.op = k;
          if (utils.isArray(v)) {
            constraint.values = v;
          } else {
            constraint.value = v;
          }
        }
      }
    }
    return constraint;
  };

  interpretConArray = function(conArgs) {
    var a0, constraint, ref1, v;
    conArgs = conArgs.slice();
    constraint = {
      path: conArgs.shift()
    };
    if (conArgs.length === 1) {
      a0 = conArgs[0];
      if (ref1 = typeof a0.toUpperCase === "function" ? a0.toUpperCase() : void 0, indexOf.call(Query.NULL_OPS, ref1) >= 0) {
        constraint.op = a0;
      } else {
        constraint.type = a0;
      }
    } else if (conArgs.length >= 2) {
      constraint.op = conArgs[0];
      v = conArgs[1];
      if (utils.isArray(v)) {
        constraint.values = v;
      } else {
        constraint.value = v;
      }
      if (conArgs.length === 3) {
        constraint.extraValue = conArgs[2];
      }
    }
    return constraint;
  };

  stringifySortOrder = function(sortOrder) {
    var oe;
    return ((function() {
      var l, len, results;
      results = [];
      for (l = 0, len = sortOrder.length; l < len; l++) {
        oe = sortOrder[l];
        results.push(oe.path + " " + oe.direction);
      }
      return results;
    })()).join(' ');
  };

  stringToSortOrder = function(str) {
    var i, l, len, parts, pathIndices, results, x;
    if (str == null) {
      return [];
    }
    parts = str.split(/\s+/);
    pathIndices = (function() {
      var l, ref1, results;
      results = [];
      for (x = l = 0, ref1 = parts.length / 2; 0 <= ref1 ? l < ref1 : l > ref1; x = 0 <= ref1 ? ++l : --l) {
        results.push(x * 2);
      }
      return results;
    })();
    results = [];
    for (l = 0, len = pathIndices.length; l < len; l++) {
      i = pathIndices[l];
      results.push([parts[i], parts[i + 1]]);
    }
    return results;
  };

  removeIrrelevantSortOrders = function() {
    var oe, oldOrder;
    oldOrder = this.sortOrder;
    this.sortOrder = (function() {
      var l, len, results;
      results = [];
      for (l = 0, len = oldOrder.length; l < len; l++) {
        oe = oldOrder[l];
        if (this.isRelevant(oe.path)) {
          results.push(oe);
        }
      }
      return results;
    }).call(this);
    if (oldOrder.length !== this.sortOrder.length) {
      return this.trigger('change:sortorder change:orderby', this.sortOrder.slice());
    }
  };

  Query = (function() {
    var addPI, cAttrs, kids, parseSummary, qAttrs, scFold, toAttrPairs, toPathAndType, xmlAttr;

    Query.JOIN_STYLES = ['INNER', 'OUTER'];

    Query.BIO_FORMATS = ['gff3', 'fasta', 'bed'];

    Query.NULL_OPS = ['IS NULL', 'IS NOT NULL'];

    Query.ATTRIBUTE_VALUE_OPS = ["=", "!=", ">", ">=", "<", "<=", "CONTAINS", "LIKE", "NOT LIKE"];

    Query.MULTIVALUE_OPS = ['ONE OF', 'NONE OF'];

    Query.RANGE_OPS = ['OVERLAPS', 'DOES NOT OVERLAP', 'OUTSIDE', 'WITHIN', 'CONTAINS', 'DOES NOT CONTAIN'];

    Query.TERNARY_OPS = ['LOOKUP'];

    Query.LOOP_OPS = ['=', '!='];

    Query.LIST_OPS = ['IN', 'NOT IN'];

    Query.OP_DICT = {
      '=': '=',
      '==': '==',
      'eq': '=',
      'eqq': '==',
      '!=': '!=',
      'ne': '!=',
      '>': '>',
      'gt': '>',
      '>=': '>=',
      'ge': '>=',
      '<': '<',
      'lt': '<',
      '<=': '<=',
      'le': '<=',
      'contains': 'CONTAINS',
      'CONTAINS': 'CONTAINS',
      'does not contain': 'DOES NOT CONTAIN',
      'DOES NOT CONTAIN': 'DOES NOT CONTAIN',
      'like': 'LIKE',
      'LIKE': 'LIKE',
      'not like': 'NOT LIKE',
      'NOT LIKE': 'NOT LIKE',
      'lookup': 'LOOKUP',
      'IS NULL': 'IS NULL',
      'is null': 'IS NULL',
      'IS NOT NULL': 'IS NOT NULL',
      'is not null': 'IS NOT NULL',
      'ONE OF': 'ONE OF',
      'one of': 'ONE OF',
      'NONE OF': 'NONE OF',
      'none of': 'NONE OF',
      'in': 'IN',
      'not in': 'NOT IN',
      'IN': 'IN',
      'NOT IN': 'NOT IN',
      'WITHIN': 'WITHIN',
      'within': 'WITHIN',
      'OVERLAPS': 'OVERLAPS',
      'overlaps': 'OVERLAPS',
      'DOES NOT OVERLAP': 'DOES NOT OVERLAP',
      'does not overlap': 'DOES NOT OVERLAP',
      'OUTSIDE': 'OUTSIDE',
      'outside': 'OUTSIDE',
      'ISA': 'ISA',
      'isa': 'ISA'
    };

    qAttrs = ['name', 'view', 'sortOrder', 'constraintLogic', 'title', 'description', 'comment'];

    cAttrs = ['path', 'type', 'op', 'code', 'value', 'ids'];

    toAttrPairs = function(el, attrs) {
      var l, len, results, x;
      results = [];
      for (l = 0, len = attrs.length; l < len; l++) {
        x = attrs[l];
        if (el.hasAttribute(x)) {
          results.push([x, el.getAttribute(x)]);
        }
      }
      return results;
    };

    kids = function(el, name) {
      var kid, l, len, ref1, results;
      ref1 = el.getElementsByTagName(name);
      results = [];
      for (l = 0, len = ref1.length; l < len; l++) {
        kid = ref1[l];
        results.push(kid);
      }
      return results;
    };

    xmlAttr = function(name) {
      return function(el) {
        return el.getAttribute(name);
      };
    };

    Query.fromXML = function(xml) {
      var con, dom, j, pathOf, q, query, styleOf;
      dom = intermine.xml.parse(xml);
      query = kids(dom, 'query')[0] || kids(dom, 'template')[0];
      if (!query) {
        throw new Error("no query in xml");
      }
      pathOf = xmlAttr('path');
      styleOf = xmlAttr('style');
      q = utils.pairsToObj(toAttrPairs(query, qAttrs));
      q.view = q.view.split(/\s+/);
      q.sortOrder = stringToSortOrder(q.sortOrder);
      q.joins = (function() {
        var l, len, ref1, results;
        ref1 = kids(query, 'join');
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          j = ref1[l];
          if (styleOf(j) === 'OUTER') {
            results.push(pathOf(j));
          }
        }
        return results;
      })();
      q.constraints = (function() {
        var l, len, ref1, results;
        ref1 = kids(query, 'constraint');
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          con = ref1[l];
          results.push((function(con) {
            var c, tn, v, values, x;
            c = utils.pairsToObj(toAttrPairs(con, cAttrs));
            if (c.ids != null) {
              c.ids = (function() {
                var len1, m, ref2, results1;
                ref2 = c.ids.split(',');
                results1 = [];
                for (m = 0, len1 = ref2.length; m < len1; m++) {
                  x = ref2[m];
                  results1.push(parseInt(x, 10));
                }
                return results1;
              })();
            }
            values = kids(con, 'value');
            if (values.length) {
              c.values = (function() {
                var len1, m, results1;
                results1 = [];
                for (m = 0, len1 = values.length; m < len1; m++) {
                  v = values[m];
                  results1.push(((function() {
                    var len2, o, ref2, results2;
                    ref2 = v.childNodes;
                    results2 = [];
                    for (o = 0, len2 = ref2.length; o < len2; o++) {
                      tn = ref2[o];
                      results2.push(tn.data);
                    }
                    return results2;
                  })()).join(''));
                }
                return results1;
              })();
            }
            return c;
          })(con));
        }
        return results;
      })();
      return q;
    };

    Query.prototype.constraints = [];

    Query.prototype.views = [];

    Query.prototype.joins = {};

    Query.prototype.constraintLogic = '';

    Query.prototype.sortOrder = '';

    Query.prototype.name = null;

    Query.prototype.title = null;

    Query.prototype.comment = null;

    Query.prototype.description = null;

    function Query(properties, service, arg) {
      var l, len, model, prop, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, summaryFields;
      ref1 = arg != null ? arg : {}, model = ref1.model, summaryFields = ref1.summaryFields;
      this.addConstraint = bind(this.addConstraint, this);
      this.expandStar = bind(this.expandStar, this);
      this.adjustPath = bind(this.adjustPath, this);
      this.select = bind(this.select, this);
      if (properties == null) {
        properties = {};
      }
      this.constraints = [];
      this.views = [];
      this.joins = {};
      this.displayNames = utils.copy((ref2 = (ref3 = properties.displayNames) != null ? ref3 : properties.aliases) != null ? ref2 : {});
      ref4 = ['name', 'title', 'comment', 'description', 'type'];
      for (l = 0, len = ref4.length; l < len; l++) {
        prop = ref4[l];
        if (properties[prop] != null) {
          this[prop] = properties[prop];
        }
      }
      this.service = service != null ? service : {};
      this.model = (ref5 = model != null ? model : properties.model) != null ? ref5 : {};
      this.summaryFields = (ref6 = summaryFields != null ? summaryFields : properties.summaryFields) != null ? ref6 : {};
      this.root = (ref7 = properties.root) != null ? ref7 : properties.from;
      this.maxRows = (ref8 = (ref9 = properties.size) != null ? ref9 : properties.limit) != null ? ref8 : properties.maxRows;
      this.start = (ref10 = (ref11 = properties.start) != null ? ref11 : properties.offset) != null ? ref10 : 0;
      this.select(properties.views || properties.view || properties.select || []);
      this.addConstraints(properties.constraints || properties.where || []);
      this.addJoins(properties.joins || properties.join || []);
      this.orderBy(properties.sortOrder || properties.orderBy || []);
      if (properties.constraintLogic != null) {
        this.constraintLogic = properties.constraintLogic;
      }
      this.on('change:views', removeIrrelevantSortOrders, this);
    }

    Query.prototype.removeFromSelect = function(unwanted) {
      var mapFn, so, uw, v;
      if (unwanted == null) {
        unwanted = [];
      }
      unwanted = utils.stringList(unwanted);
      mapFn = utils.compose(this.expandStar, this.adjustPath);
      unwanted = utils.flatten((function() {
        var l, len, results;
        results = [];
        for (l = 0, len = unwanted.length; l < len; l++) {
          uw = unwanted[l];
          results.push(mapFn(uw));
        }
        return results;
      })());
      this.sortOrder = (function() {
        var l, len, ref1, ref2, results;
        ref1 = this.sortOrder;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          so = ref1[l];
          if (!(ref2 = so.path, indexOf.call(unwanted, ref2) >= 0)) {
            results.push(so);
          }
        }
        return results;
      }).call(this);
      this.views = (function() {
        var l, len, ref1, results;
        ref1 = this.views;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          v = ref1[l];
          if (!(indexOf.call(unwanted, v) >= 0)) {
            results.push(v);
          }
        }
        return results;
      }).call(this);
      this.trigger('remove:view', unwanted);
      this.trigger('change:views', this.views);
      return this.trigger('change', this.views);
    };

    Query.prototype.removeConstraint = function(con, silent) {
      var c, iscon, orig, reduced;
      if (silent == null) {
        silent = false;
      }
      orig = this.constraints;
      iscon = (typeof con === 'string') ? (function(c) {
        return c.code === con;
      }) : (function(c) {
        var ref1, ref2;
        return (c.path === con.path) && (c.op === con.op) && (c.value === con.value) && (c.extraValue === con.extraValue) && (con.type === c.type) && (((ref1 = c.values) != null ? ref1.join('%%') : void 0) === ((ref2 = con.values) != null ? ref2.join('%%') : void 0));
      });
      reduced = (function() {
        var l, len, results;
        results = [];
        for (l = 0, len = orig.length; l < len; l++) {
          c = orig[l];
          if (!iscon(c)) {
            results.push(c);
          }
        }
        return results;
      })();
      if (reduced.length !== orig.length - 1) {
        throw new Error(didntRemove(orig, reduced));
      }
      this.constraints = reduced;
      if (!silent) {
        this.trigger('change:constraints');
        this.trigger('change');
        return this.trigger('removed:constraint', utils.find(orig, iscon));
      }
    };

    Query.prototype.addToSelect = function(views, opts) {
      var dups, mapFn, p, ref1, ref2, toAdd, v, x;
      if (views == null) {
        views = [];
      }
      if (opts == null) {
        opts = {};
      }
      views = utils.stringList(views);
      mapFn = utils.compose(this.expandStar, this.adjustPath);
      toAdd = utils.flatten((function() {
        var l, len, results;
        results = [];
        for (l = 0, len = views.length; l < len; l++) {
          v = views[l];
          results.push(mapFn(v));
        }
        return results;
      })());
      dups = (function() {
        var l, len, results;
        results = [];
        for (l = 0, len = toAdd.length; l < len; l++) {
          p = toAdd[l];
          if (indexOf.call(this.views, p) >= 0) {
            results.push(p);
          }
        }
        return results;
      }).call(this);
      if (dups.length) {
        throw new Error(dups + " already in the select list");
      }
      dups = (function() {
        var l, len, results;
        results = [];
        for (l = 0, len = toAdd.length; l < len; l++) {
          p = toAdd[l];
          if (((function() {
            var len1, m, results1;
            results1 = [];
            for (m = 0, len1 = toAdd.length; m < len1; m++) {
              x = toAdd[m];
              if (x === p) {
                results1.push(x);
              }
            }
            return results1;
          })()).length > 1) {
            results.push(p);
          }
        }
        return results;
      })();
      if (dups.length) {
        throw new Error(dups + " specified multiple times as arguments to addToSelect");
      }
      (ref1 = this.views).push.apply(ref1, toAdd);
      if (opts.silent) {
        opts.events = ((ref2 = opts.events) != null ? ref2 : []).concat(['change', 'add:view', 'change:views']);
      } else {
        this.trigger('add:view change:views', toAdd);
        this.trigger('change');
      }
      return this;
    };

    Query.prototype.select = function(views, opts) {
      var e, oldViews;
      oldViews = this.views.slice();
      try {
        this.views = [];
        this.addToSelect(views, opts);
      } catch (error) {
        e = error;
        this.views = oldViews;
        utils.error(e);
      }
      return this;
    };

    Query.prototype.adjustPath = function(path) {
      path = (path && path.name) ? path.name : "" + path;
      if (this.root != null) {
        if (!path.match("^" + this.root)) {
          path = this.root + "." + path;
        }
      } else {
        this.root = path.split('.')[0];
      }
      return path;
    };

    Query.prototype.getPossiblePaths = function(depth, allowReverseReferences, predicate) {
      var base, getPaths, key, ret, test;
      if (depth == null) {
        depth = 3;
      }
      if (allowReverseReferences == null) {
        allowReverseReferences = true;
      }
      if (predicate == null) {
        predicate = null;
      }
      test = typeof predicate === 'string' ? function(p) {
        return p[predicate]();
      } : predicate;
      getPaths = (function(_this) {
        return function(root, d) {
          var cd, field, name, others, path, subPaths;
          path = _this.getPathInfo(root);
          if ((!allowReverseReferences) && path.isReverseReference()) {
            return [];
          } else if (path.isAttribute()) {
            return [path];
          } else {
            cd = path.getType();
            subPaths = concatMap(function(ref) {
              return getPaths(root + "." + ref.name, d - 1);
            });
            others = cd && (d > 0) ? subPaths((function() {
              var ref1, results;
              ref1 = cd.fields;
              results = [];
              for (name in ref1) {
                field = ref1[name];
                results.push(field);
              }
              return results;
            })()) : [];
            return [path].concat(others);
          }
        };
      })(this);
      key = depth + "-" + allowReverseReferences;
      if (this._possiblePaths == null) {
        this._possiblePaths = {};
      }
      ret = ((base = this._possiblePaths)[key] != null ? base[key] : base[key] = getPaths(this.root, depth)).slice();
      if (test != null) {
        return ret.filter(test);
      } else {
        return ret;
      }
    };

    Query.prototype.getPathInfo = function(path) {
      var adjusted, pi, ref1;
      adjusted = this.adjustPath(path);
      pi = (ref1 = this.model) != null ? typeof ref1.getPathInfo === "function" ? ref1.getPathInfo(adjusted, this.getSubclasses()) : void 0 : void 0;
      if (pi && adjusted in this.displayNames) {
        pi.displayName = this.displayNames[adjusted];
      }
      return pi;
    };

    Query.prototype.makePath = Query.prototype.getPathInfo;

    toPathAndType = function(c) {
      return [c.path, c.type];
    };

    scFold = utils.compose(utils.pairsToObj, utils.map(toPathAndType), filter(get('type')));

    Query.prototype.getSubclasses = function() {
      return scFold(this.constraints);
    };

    Query.prototype.getType = function(path) {
      return this.getPathInfo(path).getType();
    };

    Query.prototype.getViewNodes = function() {
      var p, toParentNode;
      toParentNode = (function(_this) {
        return function(v) {
          return _this.getPathInfo(v).getParent();
        };
      })(this);
      return utils.uniqBy(String, (function() {
        var l, len, ref1, results;
        ref1 = this.views;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          p = ref1[l];
          results.push(toParentNode(p));
        }
        return results;
      }).call(this));
    };

    Query.prototype.isInView = function(path) {
      var pi, pstr, ref1;
      pi = this.getPathInfo(path);
      if (!pi) {
        throw new Error("Invalid path: " + path);
      }
      if (pi.isAttribute()) {
        return ref1 = pi.toString(), indexOf.call(this.views, ref1) >= 0;
      } else {
        pstr = pi.toString();
        return utils.any(this.getViewNodes(), function(n) {
          return n.toString() === pstr;
        });
      }
    };

    Query.prototype.isConstrained = function(path, includeAttrs) {
      var pi, test;
      if (includeAttrs == null) {
        includeAttrs = false;
      }
      pi = this.getPathInfo(path);
      if (!pi) {
        throw new Error("Invalid path: " + path);
      }
      test = function(c) {
        return (c.op != null) && c.path === pi.toString();
      };
      if ((!pi.isAttribute()) && includeAttrs) {
        test = (function(_this) {
          return function(c) {
            return (c.op != null) && (c.path === pi.toString() || pi.equals(_this.getPathInfo(c.path).getParent()));
          };
        })(this);
      }
      return utils.any(this.constraints, test);
    };

    Query.prototype.canHaveMultipleValues = function(path) {
      return this.getPathInfo(path).containsCollection();
    };

    Query.prototype.getQueryNodes = function() {
      var c, constrainedNodes, pi, viewNodes;
      viewNodes = this.getViewNodes();
      constrainedNodes = (function() {
        var l, len, ref1, results;
        ref1 = this.constraints;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          c = ref1[l];
          if (!(c.type == null)) {
            continue;
          }
          pi = this.getPathInfo(c.path);
          if (pi.isAttribute()) {
            results.push(pi.getParent());
          } else {
            results.push(pi);
          }
        }
        return results;
      }).call(this);
      return utils.uniqBy(String, viewNodes.concat(constrainedNodes));
    };

    Query.prototype.isInQuery = function(p) {
      var c, l, len, pi, pstr, ref1;
      pi = this.getPathInfo(p);
      if (pi) {
        pstr = pi.toPathString();
        ref1 = this.views.concat((function() {
          var len, m, ref1, results;
          ref1 = this.constraints;
          results = [];
          for (m = 0, len = ref1.length; m < len; m++) {
            c = ref1[m];
            if (c.type == null) {
              results.push(c.path);
            }
          }
          return results;
        }).call(this));
        for (l = 0, len = ref1.length; l < len; l++) {
          p = ref1[l];
          if (0 === p.indexOf(pstr)) {
            return true;
          }
        }
        return false;
      }
      return true;
    };

    Query.prototype.isRelevant = function(path) {
      var nodes, pi, sought;
      pi = this.getPathInfo(path);
      if (pi.isAttribute()) {
        pi = pi.getParent();
      }
      sought = pi.toString();
      nodes = this.getViewNodes();
      return utils.any(nodes, function(n) {
        return n.toPathString() === sought;
      });
    };

    Query.prototype.expandStar = function(path) {
      var attrViews, cd, expand, fn, n, name, pathStem, starViews;
      if (/\*$/.test(path)) {
        pathStem = path.substr(0, path.lastIndexOf('.'));
        expand = function(x) {
          return pathStem + x;
        };
        cd = this.getType(pathStem);
        if (/\.\*$/.test(path)) {
          if (cd && this.summaryFields[cd.name]) {
            fn = utils.compose(expand, decapitate);
            return (function() {
              var l, len, ref1, results;
              ref1 = this.summaryFields[cd.name];
              results = [];
              for (l = 0, len = ref1.length; l < len; l++) {
                n = ref1[l];
                if (!this.hasView(n)) {
                  results.push(fn(n));
                }
              }
              return results;
            }).call(this);
          }
        } else if (/\.\*\*$/.test(path)) {
          starViews = this.expandStar(pathStem + '.*');
          attrViews = (function() {
            var results;
            results = [];
            for (name in cd.attributes) {
              results.push(expand("." + name));
            }
            return results;
          })();
          return utils.uniqBy(id, starViews.concat(attrViews));
        }
      }
      return path;
    };

    Query.prototype.isOuterJoin = function(p) {
      return this.joins[this.adjustPath(p)] === 'OUTER';
    };

    Query.prototype.hasView = function(v) {
      var ref1;
      return this.views && (ref1 = this.adjustPath(v), indexOf.call(this.views, ref1) >= 0);
    };

    Query.prototype.count = function(cont) {
      if (this.service.count) {
        return this.service.count(this, cont);
      } else {
        throw new Error("This query has no service with count functionality attached.");
      }
    };

    Query.prototype.appendToList = function(target, cb) {
      var name, processor, req, toRun, updateTarget;
      if (target != null ? target.name : void 0) {
        name = target.name;
        updateTarget = function(err, list) {
          if (err == null) {
            return target.size = list.size;
          }
        };
      } else {
        name = String(target);
        updateTarget = null;
      }
      toRun = this.makeListQuery();
      req = {
        listName: name,
        query: toRun.toXML()
      };
      processor = LIST_PIPE(this.service);
      return withCB(updateTarget, cb, this.service.post('query/append/tolist', req).then(processor));
    };

    Query.prototype.selectPreservingImpliedConstraints = function(paths) {
      var l, len, n, ref1, toRun;
      if (paths == null) {
        paths = [];
      }
      toRun = this.clone();
      toRun.select(paths);
      ref1 = this.getViewNodes();
      for (l = 0, len = ref1.length; l < len; l++) {
        n = ref1[l];
        if (!this.isOuterJoined(n)) {
          if (!(toRun.isInView(n || toRun.isConstrained(n))) && (n.getEndClass().fields.id != null)) {
            toRun.addConstraint([n.append('id'), 'IS NOT NULL']);
          }
        }
      }
      return toRun;
    };

    Query.prototype.makeListQuery = function() {
      var paths, ref1;
      paths = this.views.slice();
      if (paths.length !== 1 || !((ref1 = paths[0]) != null ? ref1.match(/\.id$/) : void 0)) {
        paths = ['id'];
      }
      return this.selectPreservingImpliedConstraints(paths);
    };

    Query.prototype.saveAsList = function(options, cb) {
      var req, toRun;
      toRun = this.makeListQuery();
      req = utils.copy(options);
      req.listName = req.listName || req.name;
      req.query = toRun.toXML();
      if (options.tags) {
        req.tags = options.tags.join(';');
      }
      return withCB(cb, this.service.post('query/tolist', req).then(LIST_PIPE(this.service)));
    };

    Query.prototype.summarise = function(path, limit, cont) {
      return this.filterSummary(path, '', limit, cont);
    };

    Query.prototype.summarize = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.summarise.apply(this, args);
    };

    parseSummary = function(data) {
      var isNumeric, l, len, r, ref1, ref2, stats;
      isNumeric = ((ref1 = data.results[0]) != null ? ref1.max : void 0) != null;
      ref2 = data.results;
      for (l = 0, len = ref2.length; l < len; l++) {
        r = ref2[l];
        r.count = parseInt(r.count, 10);
      }
      stats = {
        uniqueValues: data.uniqueValues,
        filteredCount: data.filteredCount
      };
      if (isNumeric) {
        stats = merge(stats, data.results[0]);
      }
      data.stats = stats;
      return data;
    };

    Query.prototype.filterSummary = function(path, term, limit, cont) {
      var ref1, req, toRun;
      if (cont == null) {
        cont = (function() {});
      }
      if (utils.isFunction(limit)) {
        ref1 = [limit, null], cont = ref1[0], limit = ref1[1];
      }
      path = this.adjustPath(path);
      toRun = this.clone();
      if (indexOf.call(toRun.views, path) < 0) {
        toRun.views.push(path);
      }
      req = {
        query: toRun.toXML(),
        summaryPath: path,
        format: 'jsonrows'
      };
      if (limit) {
        req.size = limit;
      }
      if (term) {
        req.filterTerm = term;
      }
      return withCB(cont, this.service.post('query/results', req).then(parseSummary));
    };

    Query.prototype.clone = function(cloneEvents) {
      var cloned, k, ref1, v;
      cloned = new Query(this, this.service);
      if (cloned._callbacks == null) {
        cloned._callbacks = {};
      }
      if (cloneEvents) {
        ref1 = this._callbacks;
        for (k in ref1) {
          if (!hasProp.call(ref1, k)) continue;
          v = ref1[k];
          cloned._callbacks[k] = v;
        }
        cloned.off('change:views', removeIrrelevantSortOrders, this);
      }
      return cloned;
    };

    Query.prototype.next = function() {
      var clone;
      clone = this.clone();
      if (this.maxRows) {
        clone.start = this.start + this.maxRows;
      }
      return clone;
    };

    Query.prototype.previous = function() {
      var clone;
      clone = this.clone();
      if (this.maxRows) {
        clone.start = this.start - this.maxRows;
      } else {
        clone.start = 0;
      }
      return clone;
    };

    Query.prototype.getSortDirection = function(sorted) {
      var a, so;
      a = this.adjustPath(sorted);
      if (!(this.isInQuery(a) || this.isRelevant(a))) {
        throw new Error(sorted + " is not in the query");
      }
      so = utils.find(this.sortOrder, function(arg) {
        var path;
        path = arg.path;
        return a === path;
      });
      return so != null ? so.direction : void 0;
    };

    Query.prototype.isOuterJoined = function(path) {
      var dir, jp, ref1;
      path = this.adjustPath(path);
      ref1 = this.joins;
      for (jp in ref1) {
        dir = ref1[jp];
        if (dir === 'OUTER' && path.indexOf(jp) === 0) {
          return true;
        }
      }
      return false;
    };

    Query.prototype.getOuterJoin = function(path) {
      var joinPaths, k;
      path = this.adjustPath(path);
      joinPaths = ((function() {
        var results;
        results = [];
        for (k in this.joins) {
          results.push(k);
        }
        return results;
      }).call(this)).sort(function(a, b) {
        return b.length - a.length;
      });
      return utils.find(joinPaths, (function(_this) {
        return function(p) {
          return _this.joins[p] === 'OUTER' && path.indexOf(p) === 0;
        };
      })(this));
    };

    Query.prototype._parse_sort_order = function(input) {
      var direction, k, path, ref1, so, v;
      if (input == null) {
        throw new Error('No input');
      }
      if (typeof input === 'string') {
        so = {
          path: input,
          direction: 'ASC'
        };
      } else if (utils.isArray(input)) {
        path = input[0], direction = input[1];
        so = {
          path: path,
          direction: direction
        };
      } else if (input.path == null) {
        ref1 = (function() {
          var results;
          results = [];
          for (k in input) {
            v = input[k];
            results.push([k, v]);
          }
          return results;
        })(), path = ref1[0], direction = ref1[1];
        so = {
          path: path,
          direction: direction
        };
      } else {
        path = input.path, direction = input.direction;
        so = {
          path: path,
          direction: direction
        };
      }
      so.path = this.adjustPath(so.path);
      if (so.direction == null) {
        so.direction = 'ASC';
      }
      so.direction = so.direction.toUpperCase();
      return so;
    };

    Query.prototype.addOrSetSortOrder = function(so) {
      var currentDirection, oe;
      so = this._parse_sort_order(so);
      currentDirection = this.getSortDirection(so.path);
      if (currentDirection == null) {
        this.addSortOrder(so);
      } else if (currentDirection !== so.direction) {
        oe = utils.find(this.sortOrder, function(arg) {
          var path;
          path = arg.path;
          return path === so.path;
        });
        oe.direction = so.direction;
        this.trigger('change:sortorder', this.sortOrder);
        this.trigger('change');
      }
      return this;
    };

    Query.prototype.addSortOrder = function(so, arg) {
      var silent;
      silent = (arg != null ? arg : {}).silent;
      this.sortOrder.push(this._parse_sort_order(so));
      if (!silent) {
        this.trigger('add:sortorder', so);
        this.trigger('change:sortorder', this.sortOrder);
        return this.trigger('change');
      }
    };

    Query.prototype.orderBy = function(oes, opts) {
      var copy, direction, l, len, oe, oldSO, path, ref1;
      if (opts == null) {
        opts = {};
      }
      oldSO = this.sortOrder.slice();
      this.sortOrder = [];
      for (l = 0, len = oes.length; l < len; l++) {
        oe = oes[l];
        this.addSortOrder(this._parse_sort_order(oe), {
          silent: true
        });
      }
      copy = (function() {
        var len1, m, ref1, ref2, results;
        ref1 = this.sortOrder;
        results = [];
        for (m = 0, len1 = ref1.length; m < len1; m++) {
          ref2 = ref1[m], path = ref2.path, direction = ref2.direction;
          results.push({
            path: path,
            direction: direction
          });
        }
        return results;
      }).call(this);
      this.trigger('set:sortorder', copy);
      if ((stringifySortOrder(oldSO)) !== this.getSorting()) {
        if (opts.silent) {
          opts.events = ((ref1 = opts.events) != null ? ref1 : []).concat(['change', 'change:sortorder']);
        } else {
          this.trigger('change:sortorder', copy);
          this.trigger('change');
        }
      }
      return this;
    };

    Query.prototype.addJoins = function(joins) {
      var j, k, l, len, results, results1, v;
      if (utils.isArray(joins)) {
        results = [];
        for (l = 0, len = joins.length; l < len; l++) {
          j = joins[l];
          results.push(this.addJoin(j));
        }
        return results;
      } else {
        results1 = [];
        for (k in joins) {
          v = joins[k];
          results1.push(this.addJoin({
            path: k,
            style: v
          }));
        }
        return results1;
      }
    };

    Query.prototype.addJoin = function(join) {
      if (typeof join === 'string') {
        join = {
          path: join,
          style: 'OUTER'
        };
      }
      return this.setJoinStyle(join.path, join.style);
    };

    Query.prototype.setJoinStyle = function(path, style) {
      if (style == null) {
        style = 'OUTER';
      }
      path = this.adjustPath(path);
      style = style.toUpperCase();
      if (indexOf.call(Query.JOIN_STYLES, style) < 0) {
        throw new Error("Invalid join style: " + style);
      }
      if (this.joins[path] !== style) {
        this.joins[path] = style;
        this.trigger('change:joins', {
          path: path,
          style: style
        });
        this.trigger('change');
      }
      return this;
    };

    Query.prototype.addConstraints = function(constraints, conj) {
      var c, con, fn1, l, len, oldLogic, path;
      if (conj == null) {
        conj = 'and';
      }
      this.__silent__ = true;
      oldLogic = this.constraintLogic;
      if (utils.isArray(constraints)) {
        for (l = 0, len = constraints.length; l < len; l++) {
          c = constraints[l];
          this.addConstraint(c, conj);
        }
      } else {
        fn1 = (function(_this) {
          return function(path, con) {
            return _this.addConstraint(interpretConstraint(path, con), conj);
          };
        })(this);
        for (path in constraints) {
          con = constraints[path];
          fn1(path, con);
        }
      }
      this.__silent__ = false;
      this.trigger('add:constraint');
      this.trigger('change:constraints');
      if (oldLogic !== this.constraintLogic) {
        this.trigger('change:logic', this.constraintLogic);
      }
      return this.trigger('change');
    };

    Query.prototype.addConstraint = function(constraint, conj) {
      var i, logic, needsLogicClause, newConLen, newLogic, oldLogic, ref1;
      if (conj == null) {
        conj = 'and';
      }
      if (conj !== 'and' && conj !== 'or') {
        throw new Error('Unknown logical conjunction: ' + conj);
      }
      if (utils.isArray(constraint)) {
        constraint = interpretConArray(constraint);
      } else {
        constraint = copyCon(constraint);
      }
      if (constraint.switched === 'OFF') {
        return this;
      }
      constraint.path = this.adjustPath(constraint.path);
      if (constraint.type == null) {
        constraint.op = get_canonical_op(constraint.op);
      }
      this.constraints.push(constraint);
      needsLogicClause = (conj === 'or') || (((ref1 = this.constraintLogic) != null ? ref1.length : void 0) > 0);
      newConLen = this.constraints.length;
      oldLogic = this.constraintLogic;
      if (needsLogicClause) {
        newLogic = newConLen === 2 ? CODES[0] + " " + conj + " " + CODES[1] : (logic = this.constraintLogic, logic || (logic = ((function() {
          var l, ref2, results;
          results = [];
          for (i = l = 0, ref2 = newConLen - 2; 0 <= ref2 ? l <= ref2 : l >= ref2; i = 0 <= ref2 ? ++l : --l) {
            results.push(CODES[i]);
          }
          return results;
        })()).join(' and ')), "(" + logic + ") " + conj + " " + CODES[newConLen - 1]);
        this.constraintLogic = newLogic;
      }
      if (!this.__silent__) {
        this.trigger('add:constraint', constraint);
        this.trigger('change:constraints');
        if (oldLogic !== this.constraintLogic) {
          this.trigger('change:logic', this.constraintLogic);
        }
        this.trigger('change');
      }
      return this;
    };

    Query.prototype.getSorting = function() {
      return stringifySortOrder(this.sortOrder);
    };

    Query.prototype.getConstraintXML = function() {
      var c, toSerialise;
      toSerialise = (function() {
        var l, len, ref1, results;
        ref1 = this.constraints;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          c = ref1[l];
          if ((c.type == null) || this.isInQuery(c.path)) {
            results.push(c);
          }
        }
        return results;
      }).call(this);
      if (toSerialise.length) {
        return concatMap(conStr)(concatMap(id)(partition(function(c) {
          return c.type != null;
        })(toSerialise)));
      } else {
        return '';
      }
    };

    Query.prototype.getJoinXML = function() {
      var p, s, strs;
      strs = (function() {
        var ref1, results;
        ref1 = this.joins;
        results = [];
        for (p in ref1) {
          s = ref1[p];
          if (this.isInQuery(p) && s === 'OUTER') {
            results.push("<join path=\"" + p + "\" style=\"OUTER\"/>");
          }
        }
        return results;
      }).call(this);
      return strs.join('');
    };

    Query.prototype.toXML = function() {
      var attrs, headAttrs, k, v;
      attrs = {
        model: this.model.name,
        view: this.views.join(' '),
        sortOrder: this.getSorting(),
        constraintLogic: this.constraintLogic
      };
      if (this.name != null) {
        attrs.name = this.name;
      }
      headAttrs = ((function() {
        var results;
        results = [];
        for (k in attrs) {
          v = attrs[k];
          if (v) {
            results.push(k + '="' + v + '"');
          }
        }
        return results;
      })()).join(' ');
      return "<query " + headAttrs + " >" + (this.getJoinXML()) + (this.getConstraintXML()) + "</query>";
    };

    Query.prototype.toJSON = function() {
      var c, direction, path, style, v;
      return noUndefVals({
        name: this.name,
        title: this.title,
        comment: this.comment,
        description: this.description,
        constraintLogic: this.constraintLogic,
        from: this.root,
        select: (function() {
          var l, len, ref1, results;
          ref1 = this.views;
          results = [];
          for (l = 0, len = ref1.length; l < len; l++) {
            v = ref1[l];
            results.push(headLess(v));
          }
          return results;
        }).call(this),
        orderBy: (function() {
          var l, len, ref1, ref2, results;
          ref1 = this.sortOrder;
          results = [];
          for (l = 0, len = ref1.length; l < len; l++) {
            ref2 = ref1[l], path = ref2.path, direction = ref2.direction;
            results.push({
              path: headLess(path),
              direction: direction
            });
          }
          return results;
        }).call(this),
        joins: (function() {
          var ref1, results;
          ref1 = this.joins;
          results = [];
          for (path in ref1) {
            style = ref1[path];
            if (style === 'OUTER') {
              results.push(headLess(path));
            }
          }
          return results;
        }).call(this),
        where: (function() {
          var l, len, ref1, results;
          ref1 = this.constraints;
          results = [];
          for (l = 0, len = ref1.length; l < len; l++) {
            c = ref1[l];
            results.push(conToJSON(c));
          }
          return results;
        }).call(this)
      });
    };

    Query.prototype.fetchCode = function(lang, cb) {
      var req;
      req = {
        query: this.toXML(),
        lang: lang
      };
      return withCB(cb, this.service.post('query/code', req).then(this.service.VERIFIER).then(get('code')));
    };

    Query.prototype.setName = function(name1) {
      this.name = name1;
    };

    Query.prototype.save = function(name, cb) {
      return REQUIRES_VERSION(this.service, 16, (function(_this) {
        return function() {
          var ref1, req;
          if (utils.isFunction(name)) {
            ref1 = [null, name], name = ref1[0], cb = ref1[1];
          }
          if (name != null) {
            _this.setName(name);
          }
          req = {
            type: 'PUT',
            path: 'user/queries',
            data: _this.toXML(),
            contentType: 'application/xml',
            dataType: 'json'
          };
          return withCB(cb, _this.service.authorise(req)).then(function(authed) {
            return _this.service.doReq(authed);
          }).then(function(resp) {
            return resp.queries;
          });
        };
      })(this));
    };

    Query.prototype.store = function(name, cb) {
      return REQUIRES_VERSION(this.service, 16, (function(_this) {
        return function() {
          var getName, ref1, req, updateName;
          if (utils.isFunction(name)) {
            ref1 = [null, name], name = ref1[0], cb = ref1[1];
          }
          if (name != null) {
            _this.setName(name);
          }
          updateName = function(err, name) {
            if (err == null) {
              return _this.setName(name);
            }
          };
          getName = utils.compose(get(_this.name), get('queries'));
          req = {
            type: 'POST',
            path: 'user/queries',
            data: _this.toXML(),
            contentType: 'application/xml',
            dataType: 'json'
          };
          return withCB(cb, updateName, _this.service.authorise(req)).then(function(authed) {
            return _this.service.doReq(authed);
          }).then(getName);
        };
      })(this));
    };

    Query.prototype.saveAsTemplate = function(name, cb) {
      return REQUIRES_VERSION(this.service, 16, (function(_this) {
        return function() {
          var ref1, req;
          if (utils.isFunction(name)) {
            ref1 = [null, name], name = ref1[0], cb = ref1[1];
          }
          if (name != null) {
            _this.setName(name);
          }
          if (!_this.name) {
            throw new Error("Templates must have a name");
          }
          req = {
            type: 'POST',
            path: 'templates',
            data: "<template " + (conAttrs(_this, ['name', 'title', 'comment'])) + ">" + (_this.toXML()) + "</template>",
            contentType: 'application/xml',
            dataType: 'json'
          };
          return withCB(cb, _this.service.authorise(req).then(function(authed) {
            return _this.service.doReq(authed);
          }));
        };
      })(this));
    };

    Query.prototype.getCodeURI = function(lang) {
      var ref1, req;
      req = {
        query: this.toXML(),
        lang: lang,
        format: 'text'
      };
      if (((ref1 = this.service) != null ? ref1.token : void 0) != null) {
        req.token = this.service.token;
      }
      return this.service.root + "query/code?" + (toQueryString(req));
    };

    Query.prototype.getExportURI = function(format, options) {
      var ref1, req;
      if (format == null) {
        format = 'tab';
      }
      if (options == null) {
        options = {};
      }
      if (indexOf.call(Query.BIO_FORMATS, format) >= 0) {
        return this["get" + (format.toUpperCase()) + "URI"](options);
      }
      req = merge(options, {
        query: this.toXML(),
        format: format
      });
      if (((ref1 = this.service) != null ? ref1.token : void 0) != null) {
        req.token = this.service.token;
      }
      return this.service.root + "query/results?" + (toQueryString(req));
    };

    Query.prototype.needsAuthentication = function() {
      return utils.any(this.constraints, function(c) {
        var ref1;
        return (ref1 = c.op) === 'NOT IN' || ref1 === 'IN';
      });
    };

    Query.prototype.fetchQID = function(cb) {
      return withCB(cb, this.service.post('queries', {
        query: this.toXML()
      }).then(get('id')));
    };

    addPI = function(p) {
      return p.append('primaryIdentifier').toString();
    };

    Query.prototype.__bio_req = function(types, n) {
      var isSuitable, toRun;
      toRun = this.makeListQuery();
      isSuitable = function(p) {
        return utils.any(types, function(t) {
          return p.isa(t);
        });
      };
      toRun.views = utils.take(n)((function() {
        var l, len, ref1, results;
        ref1 = this.getViewNodes();
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          n = ref1[l];
          if (isSuitable(n)) {
            results.push(addPI(n));
          }
        }
        return results;
      }).call(this));
      return {
        query: toRun.toXML(),
        format: 'text'
      };
    };

    Query.prototype._fasta_req = function() {
      return this.__bio_req(["SequenceFeature", 'Protein'], 1);
    };

    Query.prototype._gff3_req = function() {
      return this.__bio_req(['SequenceFeature']);
    };

    Query.prototype._bed_req = Query.prototype._gff3_req;

    return Query;

  })();

  union = fold(function(xs, ys) {
    return xs.concat(ys);
  });

  Query.prototype.toString = Query.prototype.toXML;

  Query.ATTRIBUTE_OPS = union([Query.ATTRIBUTE_VALUE_OPS, Query.MULTIVALUE_OPS, Query.NULL_OPS]);

  Query.REFERENCE_OPS = union([Query.TERNARY_OPS, Query.LOOP_OPS, Query.LIST_OPS]);

  bioUriArgs = function(reqMeth, f) {
    return function(opts, cb) {
      var ensureAttr, obj, ref1, req, v;
      if (opts == null) {
        opts = {};
      }
      if (cb == null) {
        cb = function() {};
      }
      if (utils.isFunction(opts)) {
        ref1 = [{}, opts], opts = ref1[0], cb = ref1[1];
      }
      ensureAttr = (function(_this) {
        return function(p) {
          var path;
          path = _this.getPathInfo(p);
          if (path.isAttribute()) {
            return path;
          } else {
            return path.append('id');
          }
        };
      })(this);
      if ((opts != null ? opts.view : void 0) != null) {
        opts.view = (function() {
          var l, len, ref2, results;
          ref2 = opts.view;
          results = [];
          for (l = 0, len = ref2.length; l < len; l++) {
            v = ref2[l];
            results.push(this.getPathInfo(v).toString());
          }
          return results;
        }).call(this);
      }
      obj = opts["export"] != null ? this.selectPreservingImpliedConstraints(opts["export"].map(ensureAttr)) : this;
      req = merge(obj[reqMeth](), opts);
      return f.call(obj, req, cb);
    };
  };

  ref1 = Query.BIO_FORMATS;
  fn1 = function(f) {
    var getMeth, reqMeth, uriMeth;
    reqMeth = "_" + f + "_req";
    getMeth = "get" + (f.toUpperCase());
    uriMeth = getMeth + "URI";
    Query.prototype[getMeth] = bioUriArgs(reqMeth, function(req, cb) {
      return withCB(cb, this.service.post('query/results/' + f, req));
    });
    return Query.prototype[uriMeth] = bioUriArgs(reqMeth, function(req, cb) {
      if (this.service.token != null) {
        req.token = this.service.token;
      }
      return this.service.root + "query/results/" + f + "?" + (toQueryString(req));
    });
  };
  for (l = 0, len = ref1.length; l < len; l++) {
    f = ref1[l];
    fn1(f);
  }

  _get_data_fetcher = function(server_fn) {
    return function() {
      var cbs, page, ref2, x;
      page = arguments[0], cbs = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (this.service[server_fn]) {
        if (page == null) {
          page = {};
        } else if (utils.isFunction(page)) {
          page = {};
          cbs = (function() {
            var len1, m, results;
            results = [];
            for (m = 0, len1 = arguments.length; m < len1; m++) {
              x = arguments[m];
              results.push(x);
            }
            return results;
          }).apply(this, arguments);
        }
        page = noUndefVals(merge({
          start: this.start,
          size: this.maxRows
        }, page));
        return (ref2 = this.service)[server_fn].apply(ref2, [this, page].concat(slice.call(cbs)));
      } else {
        throw new Error("Service does not provide '" + server_fn + "'.");
      }
    };
  };

  for (m = 0, len1 = RESULTS_METHODS.length; m < len1; m++) {
    mth = RESULTS_METHODS[m];
    Query.prototype[mth] = _get_data_fetcher(mth);
  }

  Events.mixin(Query.prototype);

  Query.prototype.emit = Query.prototype.trigger;

  Query.prototype.bind = Query.prototype.on;

  intermine.Query = Query;

}).call(this);
