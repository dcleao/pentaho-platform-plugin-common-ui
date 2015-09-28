/*!
 * Copyright 2010 - 2015 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "./TypeRegistry",
  // TODO: need to review the registry workings so that config is split between info and model classes...
  "service!pentaho/component/info",
  "service!pentaho/component/model",
  "service!pentaho/component/config"
], function(TypeRegistry, TypeInfoClasses, ModelClasses, typeConfigs) {

  /*global Promise:true*/

  /**
   * The singleton instance where component types and their configurations are registered.
   *
   * The registry is pre-loaded with the following AMD _services_:
   * 1. `"pentaho/component/info"` - {@link pentaho.component.spec.TypeInfo}
   * 2. `"pentaho/component/model"` - {@link pentaho.component.spec.Model}
   * 3. `"pentaho/component/config"` - {@link pentaho.component.spec.TypeConfigRules}
   *
   * Additional component types and configurations may be loaded dynamically by using the methods
   * {@link pentaho.component.TypeRegistry#add} and {@link pentaho.component.TypeRegistry#addConfig},
   * respectively.
   *
   * #### AMD
   *
   * **Module Id**: `"pentaho/component/registry"`
   *
   * @alias registry
   * @memberOf pentaho.component
   * @type pentaho.component.TypeRegistry
   * @amd pentaho/component/registry
   */
  var typeRegistry = new TypeRegistry();

  // Auto-load the registry with ITypeConfig instances
  if(typeConfigs) typeConfigs.forEach(function(typeConfig) {
    if(typeConfig && typeConfig.types)
      typeConfig.types.forEach(function(typeConfig) {
      if(typeConfig)
        typeRegistry.addConfig(typeConfig);
    });
  });

  // Auto-load the registry with Type classes.
  TypeInfoClasses.forEach(function(Type) {
    typeRegistry.add(Type);
  });

  return typeRegistry;
});
