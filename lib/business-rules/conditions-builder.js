(function($) {
  $.fn.conditionsBuilder = function(options) {
    if(options == "data") {
      var builder = $(this).eq(0).data("conditionsBuilder");
      return builder.collectData();
    } else {
      return $(this).each(function() {
        var builder = new ConditionsBuilder(this, options);
        $(this).data("conditionsBuilder", builder);
      });
    }
  };

  function ConditionsBuilder(element, options) {
    this.element = $(element);
    this.options = options || {};
    this.init();
  }

  ConditionsBuilder.prototype = {
    init: function() {
      this.fields = this.options.fields;
      this.data = this.options.data || {"all": []};
      var rules = this.buildRules(this.data);
      this.element.html(rules);
    },

    collectData: function() {
      return this.collectDataFromNode(this.element.find("> .conditional"));
    },

    collectDataFromNode: function(element) {
      var klass = null;
      var _this = this;
      if(element.is(".conditional")) {
        klass = element.find("> .all-any-none-wrapper > .all-any-none").val();
      }

      if(klass) {
        var out = {};
        out[klass] = [];
        element.find("> .conditional, > .rule").each(function() {
          out[klass].push(_this.collectDataFromNode($(this)));
        });
        return out;
      }
      else {
        var type = element.find(".changeFieldLink").attr("id");
        type = [".",type].join("");
        var vl = element.find(type).val();
        var nm = element.find(".field").val();
        // removes text " ( type )"
        vl = vl.substring(0,vl.indexOf(" ("));
        nm =nm.substring(0,nm.indexOf(" ("));

        return {
          name: nm,
          operator: element.find(".operator").val(),
          value: vl,
          isLiteral: type === ".literal"
        };
      }
    },

    buildRules: function(ruleData) {
      return this.buildConditional(ruleData) || this.buildRule(ruleData);
    },

    buildConditional: function(ruleData) {
      var kind;
      if(ruleData.all) { kind = "all"; }
      else if(ruleData.any) { kind = "any"; }
      else if (ruleData.none) { kind = "none"; }
      if(!kind) { return; }

      var div = $("<div>", {"class": "conditional " + kind});
      var selectWrapper = $("<div>", {"class": "all-any-none-wrapper"});
      var select = $("<select>", {"class": "all-any-none select2-selection"});
      select.append($("<option>", {"id":"all","value": "all", "text": Venki.Localize.Suite.AllOpt, "selected": kind == "all"}));
      select.append($("<option>", {"id":"any","value": "any", "text": Venki.Localize.Suite.AnyOpt, "selected": kind == "any"}));
      select.append($("<option>", {"id":"none","value": "none", "text": Venki.Localize.Suite.NoneOpt, "selected": kind == "none"}));
      selectWrapper.append(select);
      div.append(selectWrapper);

      var removeLink = $("<a>", {"class": "remove remove-subcondition fa fa-trash-o", "href": "#", "text": ""});
      removeLink.click(function(e) {
        e.preventDefault();
        div.remove();
      });
      div.append(removeLink);

      var addRuleLink = $("<a>", {"href": "#", "class": "add-rule", "text": Venki.Localize.Suite.AddRule});
      var _this = this;
      addRuleLink.click(function(e) {
        e.preventDefault();
        var f = _this.fields[0];
        var newField = {name: f.value, operator: f.operators[0], value: null};
        div.append(_this.buildRule(newField));
      });
      div.append(addRuleLink);

      var addConditionLink = $("<a>", {"href": "#", "class": "add-condition", "text": Venki.Localize.Suite.AddSubCondition});
      addConditionLink.click(function(e) {
        e.preventDefault();
        var f = _this.fields[0];
        var newField = {"all": [{name: f.value, operator: f.operators[0], value: null}]};
        div.append(_this.buildConditional(newField));
      });
      div.append(addConditionLink);


      var rules = ruleData[kind];
      for(var i=0; i<rules.length; i++) {
        div.append(this.buildRules(rules[i]));
      }
      return div;
    },

    buildRule: function(ruleData) {
      var ruleDiv = $("<div>", {"class": "rule"});
      var fieldSelect = getFieldSelect(this.fields, ruleData);
      var operatorSelect = getOperatorSelect();

      fieldSelect.change(onFieldSelectChanged.call(this, operatorSelect, ruleData));

      ruleDiv.append(fieldSelect);
      ruleDiv.append(operatorSelect);
      ruleDiv.append(literallink());
      ruleDiv.append(removeLink());

      fieldSelect.change();
      ruleDiv.find("> .value").val(ruleData.value);
      return ruleDiv;
    },

    operatorsFor: function(fieldName) {
      for(var i=0; i < this.fields.length; i++) {
        var field = this.fields[i];
        if(field.name == fieldName) {
          return field.operators;
        }
      }
    }
  };

  function getFieldSelect(fields, ruleData) {
    var select = $("<select>", {"class": "field select2-selection"});
    for(var i=0; i < fields.length; i++) {
      var field = fields[i];
      var option = $("<option>", {
        text: field.label,
        value: field.name,
        selected: ruleData.name == field.name
      });
      option.data("options", field.options);
      select.append(option);
    }
    return select;
  }

  function getOperatorSelect() {
    var select = $("<select>", {"class": "operator select2-selection"});
    select.change(onOperatorSelectChange);
    return select;
  }

  function removeLink() {
    var removeLink = $("<a>", {"class": "remove remove-rule fa fa-trash-o", "href": "#", "text": ""});
    removeLink.click(onRemoveLinkClicked);
    return removeLink;
  }

  function literallink() {
    var literalLink = $("<a>", {"class": "fa fa-recycle changeFieldLink", "href": "#", "id": "venkifield"});
    literalLink.click(onLiteralClicked);
    return literalLink;
  }

  function onLiteralClicked(e) {
       e.preventDefault();
        if ($(this).attr("id") ==="venkifield"){
            $(this).siblings(".literal").show();
            $(this).siblings(".venkifield").hide();
            $(this).attr("id","literal")
        }
        else {
            $(this).siblings(".literal").hide();
            if  ($(this).siblings(".operator").data("fieldType") !== 0)
                $(this).siblings(".venkifield").show();
            $(this).attr("id","venkifield")
        }
  }

  function onRemoveLinkClicked(e) {
    e.preventDefault();
    $(this).parents(".rule").remove();
  }

  function onFieldSelectChanged(operatorSelect, ruleData) {
    var builder = this;
    return function(e) {
      var operators = builder.operatorsFor($(e.target).val());
      operatorSelect.empty();
      for(var i=0; i < operators.length; i++) {
        var operator = operators[i];
        var option = $("<option>", {
          text: operator.label || operator.name,
          value: operator.name,
          selected: ruleData.operator == operator.name
        });
        option.data("fieldType", operator.fieldType);
        operatorSelect.append(option);
      }
      operatorSelect.change();
    }
  }

  function onOperatorSelectChange(e) {
    var $this = $(this);
    var option = $this.find("> :selected");
    var container = $this.parents(".rule");
    var fieldSelect = container.find(".field");
    var currentValue = container.find(".value");
    var val = currentValue.val();
    var field = fieldSelect.clone();
    field.removeClass("field");
    field.addClass("value venkifield");
    var changeFLink =  container.find(".changeFieldLink");
    changeFLink.after(field);

    switch(option.data("fieldType")) {
      case 0:
      case "none":
        changeFLink.after($("<input>", {"type": "hidden", "class": "value literal"}));
        field.remove();
        changeFLink.hide();
        break;
      case 1:
      case "text":
        changeFLink.show();
        changeFLink.after($("<input>", {"type": "text", "class": "value literal"}).hide());
        break;
      case 2:
      case "textarea":
        changeFLink.show();
        changeFLink.after($("<textarea>", {"class": "value literal"}).hide());
        break;
      case 3:
      case "select":
        var select = $("<select>", {"class": "value  select2-selection"}).hide();
        var options = fieldSelect.find("> :selected").data("options");
        for(var i=0; i < options.length; i++) {
          var opt = options[i];
          select.append($("<option>", {"text": opt.label || opt.name, "value": opt.name}));
        }
        changeFLink.hide();
        changeFLink.after(select);
        break;

    }
    currentValue.remove();
  }

})(jQuery);
