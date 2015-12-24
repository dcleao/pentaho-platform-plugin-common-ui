define([
  "pentaho/visual",
  "pentaho/i18n!type",
  "./theme/type"
], function(visualFactory, bundle) {

  "use strict";

  /**
   * Creates a `CalcType` for a given context.
   *
   * @name calcFactory
   * @memberOf pentaho.visual.samples
   * @type pentaho.type.TypeFactory
   * @amd pentaho/visual/samples/calc
   */
  return function(context) {

    var VisualType = context.get(visualFactory);

    return VisualType.extend({
      id: "pentaho/visual/samples/calc",
      v2Id: "sample_calc",

      viewId: "View", // relative to declaring type's `id` unless prefixed with /. When type is anonymous, it's global?
      styleClass: "pentaho-visual-samples-calculator",
      props: [
        // TODO: review how to declare visual roles...
        {
          name: "levels",
          type: "stringBinding",
          list: true,
          required: true
        },
        {
          name: "measure",
          type: {
            base: "role",
            otherTypes: ["number"]
          },
          required: true
        },
        {
          name: "operation",
          type: {
            base: "string", // "." - inherited property type
            domain: ["min", "max", "avg", "sum"]
          },
          value: "min"
        }
      ]
    })
    .implement(bundle.structured);
  };
});
