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
  "service!pentaho/component/TypeDefinition",
  "service!pentaho/component/ITypeConfiguration"
], function(TypeRegistry, CompTypeDefs, compTypeConfigs) {

  /*global Promise:true*/

  /**
   * The singleton instance where component type definitions and their configurations are registered.
   *
   * The component type registry comes pre-loaded with the AMD _services_:
   * 1. {@link pentaho.component.ITypeConfiguration}
   * 2. {@link pentaho.component.TypeDefinition}
   *
   * Additional component types and configurations may be loaded
   * dynamically by using the methods
   * {@link pentaho.component.TypeRegistry#add} and
   * {@link pentaho.component.TypeRegistry#addConfig},
   * respectively.
   *
   * #### AMD
   *
   * **Module Id**: `"pentaho/component/registry"`
   *
   * @alias registry
   * @type pentaho.component.TypeRegistry
   * @memberOf pentaho.component
   * @amd pentaho/component/registry
   */
  var typeRegistry = new TypeRegistry();

  // Auto-load the registry with ITypeConfiguration instances
  if(compTypeConfigs) compTypeConfigs.forEach(function(compTypeConfig) {
    if(compTypeConfig && compTypeConfig.types)
      compTypeConfig.types.forEach(function(typeConfig) {
      if(typeConfig)
        typeRegistry.addConfig(typeConfig);
    });
  });

  // Auto-load the registry with TypeDefinition classes.
  CompTypeDefs.forEach(function(CompTypeDef) {
    typeRegistry.add(CompTypeDef);
  });

  return typeRegistry;
});
