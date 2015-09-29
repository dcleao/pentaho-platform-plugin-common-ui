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
  "../lang/Base",
  "../util/error"
], function(Base, error) {

  return Base.extend("pentaho.component.ItemInfo", {
    //region label property

    // -> nonEmptyString, Required, Inherited, Configurable, ReadOnlyAfterConfig, Localized

    _label: undefined,

    get label() {
      return this._label;
    },

    set label(value) {
      if(value === undefined) {
        delete this._label;
        // Ensure there is an inherited value.
        if(!this._label) throw error.argRequired("label");
      } else {
        // null || ""
        if(!value) throw error.argRequired("label");
        this._label = value;
      }
    },
    //endregion

    //region description property

    // -> nonEmptyString, Optional, Inherited, Configurable, ReadOnlyAfterConfig, Localized

    _description: null,

    get description() {
      return this._description;
    },

    set description(value) {
      if(value === undefined) {
        delete this._description;
      } else {
        this._description = value || null;
      }
    },
    //endregion

    //region category property

    // -> nonEmptyString, Required, Inherited, Configurable, ReadOnlyAfterConfig, Localized

    _category: null,

    get category() {
      return this._category;
    },

    set category(value) {
      if(value === undefined) {
        delete this._category;
        // Ensure there is an inherited value.
        if(!this._category) throw error.argRequired("category");
      } else {
        // null || ""
        if(!value) throw error.argRequired("category");
        this._category = value;
      }
    },
    //endregion

    //region helpUrl property

    // -> nonEmptyString, Optional, Inherited, Configurable, ReadOnlyAfterConfig, Localized?

    _helpUrl: null,

    get helpUrl() {
      return this._helpUrl;
    },

    set helpUrl(value) {
      if(value === undefined) {
        delete this._helpUrl;
      } else {
        this._helpUrl = value || null;
      }
    }
    //endregion
  });
});