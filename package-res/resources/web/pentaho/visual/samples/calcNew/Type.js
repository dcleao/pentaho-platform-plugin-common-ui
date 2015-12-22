define([
  "pentaho/visual",
  "pentaho/i18n!type",
  "./theme/type"
], function(VisualType, bundle) {

  return VisualType.extend({
      id: "pentaho/visual/samples/calc",
      v2Id: "sample_calc",

      viewId: "View", // relative to declaring type's `id` unless prefixed with /. When type is anonymous, it's global?
      styleClass: "pentaho-visual-samples-calculator",
      props: [
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
    .configure(bundle.structured)
    .instance;

});
