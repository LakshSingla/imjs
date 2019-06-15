(function() {
  var Contraint, IdsContraint, MultiValueConstraint, OperatorConstraint, SubTypeConstraint, ValueConstraint,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Contraint = (function() {
    function Contraint() {}

    Contraint.prototype.path = '';

    return Contraint;

  })();

  SubTypeConstraint = (function(superClass) {
    extend(SubTypeConstraint, superClass);

    function SubTypeConstraint() {
      return SubTypeConstraint.__super__.constructor.apply(this, arguments);
    }

    SubTypeConstraint.prototype.type = '';

    return SubTypeConstraint;

  })(Constraint);

  OperatorConstraint = (function(superClass) {
    extend(OperatorConstraint, superClass);

    function OperatorConstraint() {
      return OperatorConstraint.__super__.constructor.apply(this, arguments);
    }

    OperatorConstraint.prototype.op = '';

    OperatorConstraint.prototype.code = '';

    return OperatorConstraint;

  })(Constraint);

  ValueConstraint = (function(superClass) {
    extend(ValueConstraint, superClass);

    function ValueConstraint() {
      return ValueConstraint.__super__.constructor.apply(this, arguments);
    }

    ValueConstraint.prototype.value = '';

    ValueConstraint.prototype.extraValue = '';

    return ValueConstraint;

  })(OperatorConstraint);

  MultiValueConstraint = (function(superClass) {
    extend(MultiValueConstraint, superClass);

    function MultiValueConstraint() {
      return MultiValueConstraint.__super__.constructor.apply(this, arguments);
    }

    MultiValueConstraint.prototype.values = [];

    return MultiValueConstraint;

  })(OperatorConstraint);

  IdsContraint = (function(superClass) {
    extend(IdsContraint, superClass);

    function IdsContraint() {
      return IdsContraint.__super__.constructor.apply(this, arguments);
    }

    IdsContraint.prototype.ids = [];

    return IdsContraint;

  })(OperatorConstraint);

}).call(this);
