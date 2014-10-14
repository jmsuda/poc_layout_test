/*******************************************************************************
 * Copyright 2014 Ivan Shubin http://galenframework.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ******************************************************************************/


String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};

function listToArray(list) {
    return GalenUtils.listToArray(list);
}

var GalenPages = {
    settings: {
        cacheWebElements: true,
        allowReporting: true,
    },
    report: function (name, details) {
        if (GalenPages.settings.allowReporting) {
            var testSession = TestSession.current();
            if (testSession != null) {
                var node = testSession.getReport().info(name);

                if (details != undefined && details != null) {
                    node.withDetails(details);
                }
            }
        }
    },
    Locator: function (type, value) {
        this.type = type;
        this.value = value;
    },
    parseLocator: function (locatorText) {
        var index = locatorText.indexOf(":");
        if (index > 0 ) {
            var typeText = locatorText.substr(0, index).trim();
            var value = locatorText.substr(index + 1, locatorText.length - 1 - index).trim();
            var type = "css";
            if (typeText == "id") {
                type = typeText;
            }
            else if (typeText == "xpath") {
                type = typeText;
            }
            else if (typeText == "css") {
                type = typeText;
            }
            else {
                throw new Error("Unknown locator type: " + typeText);
            }

            return new this.Locator(type, value);
        }
        else return {
            type: "css",
            value: locatorText
        };
    },
    Page: function (driver, mainFields, secondaryFields) {
        this.driver = driver;
        this.waitTimeout = "10s";
        this.waitPeriod = "1s";
        this._report = function (name) {
            try {
                GalenPages.report(name);
            }
            catch (err) {

            }
        },
        this.open = function (url) {
            this._report("Open " + url);
            this.driver.get(url);
        },
        this.findChild = function (locator) {
            if (typeof locator == "string") {
                locator = GalenPages.parseLocator(locator);
            }

            if (this.parent != undefined ) {
                return this.parent.findChild(locator);
            }
            else {
                try {
                    var element = this.driver.findElement(GalenPages.convertLocator(locator));
                    if (element == null) {
                        throw new Error("No such element: " + locator.type + " " + locator.value);
                    }
                    return element;
                }
                catch(error) {
                    throw new Error("No such element: " + locator.type + " " + locator.value);
                }
            }
        };
        this.findChildren = function (locator) {
            if (typeof locator == "string") {
                locator = GalenPages.parseLocator(locator);
            }

            if (this.parent != undefined ) {
                return this.parent.findChildren(locator);
            }
            else {
                var list = this.driver.findElements(GalenPages.convertLocator(locator));
                return listToArray(list);
            }
        };
        this.set = function (props) {
            for (var property in props) {
                if (props.hasOwnProperty(property)) {
                    this[property] = props[property];
                }
            }
            return this;
        };
        this.waitForIt = function () {
            if (this.primaryFields.length > 0 ) {
                var conditions = {};
                var primaryFields = this.primaryFields;
                var page = this;

                for (var i = 0; i<this.primaryFields.length; i++) {
                    conditions[this.primaryFields[i] + " to be displayed"] = {
                        field: this[this.primaryFields[i]],
                        apply: function () {
                            return this.field.exists();
                        }
                    };
                }

                GalenPages.wait({time: this.waitTimeout, period: this.waitPeriod, message: "timeout waiting for page elements:"}).untilAll(conditions);
            }
            else throw  new Error("You can't wait for page as it does not have any fields defined");
            return this;
        };

        var thisPage = this;

        var iterateOverFields = function (fields, apply) {
            if (fields != undefined) {
                for (var property in fields) {
                    if (fields.hasOwnProperty(property)) {
                        var value = fields[property];
                        if (typeof value == "string") {
                            thisPage[property] = new GalenPages.PageElement(property, GalenPages.parseLocator(value), thisPage);
                            apply(property);
                        }
                        else {
                            thisPage[property] = value;
                        }
                    }
                }
            }
        }

        this.primaryFields = [];
        thisPrimaryFields = this.primaryFields;
        iterateOverFields(mainFields, function (property) {
            thisPrimaryFields.push(property);
        });

        iterateOverFields(secondaryFields, function (property) {});
    },
    PageElement: function (name, locator, parent) {
        this.name = name;
        if (typeof parent === "undefined") {
            parent = null;
        }
        this.cachedWebElement = null;
        this.locator = locator,
        this.parent = parent,
        this.isEnabled = function () {
            return this.getWebElement().isEnabled();
        };
        this.attribute = function(attrName) {
            return this.getWebElement().getAttribute(attrName);
        };
        this._report = function (name) {
            try {
                GalenPages.report(name, this.locator.type + ": " + this.locator.value);
            }
            catch (err) {

            }
        },
        this.cssValue = function (cssProperty) {
            return this.getWebElement().getCssValue(cssProperty);
        };
        this.click = function () {
            this._report("Click " + this.name);
            this.getWebElement().click();
        };
        this.typeText = function (text) {
            this._report("Type text \"" + text + "\" to " + this.name);
            this.getWebElement().sendKeys(text);
        };
        this.clear = function () {
            this._report("Clear " + this.name);
            this.getWebElement().clear();
        };
        this.getWebElement = function () {
            if (GalenPages.settings.cacheWebElements && this.cachedWebElement == null) {
                this.cachedWebElement = this.parent.findChild(this.locator);
            }
            return this.cachedWebElement;
        };
        this.isDisplayed = function () {
            return this.getWebElement().isDisplayed();
        };
        this.selectByValue = function (value) {
            this._report("Select by value \"" + value + "\" in " + this.name);
            var option = this.getWebElement().findElement(By.xpath(".//option[@value=\"" + value + "\"]"));
            if (option != null) {
                option.click();
            }
            else throw  new Error("Cannot find option with value \"" + value + "\"");
        };
        this.selectByText = function (text) {
            this._report("Select by text \"" + text + "\" in " + this.name);
            var option = this.getWebElement().findElement(By.xpath(".//option[normalize-space(.)=\"" + text + "\"]"));
            if (option != null) {
                option.click();
            }
            else throw  new Error("Cannot find option with text \"" + value + "\"");
        };
        this.waitFor = function(func, messageSuffix, time) {
            time = typeof time !== 'undefined' ? time : "10s";
            var name = typeof this.name !== 'undefined' ? this.name : "";
            var msg =  name + " " + messageSuffix;
            var thisElement = this;
            var conditions = {};
            conditions[msg] = function (){
                return func(thisElement);
            };
            GalenPages.wait({time: time, period: 200}).untilAll(conditions);
        };
        this.waitToBeShown = function (time) {
            this.waitFor(function (thisElement){
                return thisElement.exists() && thisElement.isDisplayed();
            }, "should be shown", time);
        };
        this.waitToBeHidden = function (time) {
            this.waitFor(function (thisElement){
                return !thisElement.exists() || !thisElement.isDisplayed();
            }, "should be hidden", time);
        },
        this.waitUntilExists = function (time) {
            this.waitFor(function (thisElement){
                return thisElement.exists();
            }, "should exist", time);
        };
        this.waitUntilGone = function (time) {
            this.waitFor(function (thisElement){
                return !thisElement.exists();
            }, "should not exist", time);
        };
        this.exists = function () {
            try {
                this.getWebElement();
            }
            catch(error) {
                return false;
            }
            return true;
        };
        this.findChild = function (locator) {
            if (typeof locator == "string") {
                locator = GalenPages.parseLocator(locator);
            }

            if (this.parent != undefined ) {
                return this.parent.findChild(locator);
            }
            else {
                try {
                    var element = this.driver.findElement(GalenPages.convertLocator(locator));
                    if (element == null) {
                        throw new Error("No such element: " + locator.type + " " + locator.value);
                    }
                    return element;
                }
                catch(error) {
                    throw new Error("No such element: " + locator.type + " " + locator.value);
                }
            }
        };
        this.findChildren = function (locator) {
            if (typeof locator == "string") {
                locator = GalenPages.parseLocator(locator);
            }

            if (this.parent != undefined ) {
                return this.parent.findChildren(locator);
            }
            else {
                var list = this.driver.findElements(GalenPages.convertLocator(locator));
                return listToArray(list);
            }
        };
    },
    create: function (driver) {
        return new GalenPages.Driver(driver);
    },
    extendPage: function (page, driver, mainFields, secondaryFields) {
        var obj = new GalenPages.Page(driver, mainFields, secondaryFields);

        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                page[key] = obj[key];
            }
        }
    },
    Driver: function (driver) {
        this.driver = driver;
        this.page = function (mainFields, secondaryFields) {
            return new GalenPages.Page(this.driver, mainFields, secondaryFields);
        };
        this.component = this.page;

        //basic functions
        this.get = function (url){this.driver.get(url);};
        this.refresh = function () {this.driver.navigate().reload();};
        this.back = function (){this.driver.navigate().back();};
        this.currentUrl = function (){return this.driver.getCurrentUrl();};
        this.pageSource = function () {return this.driver.getPageSource();};
        this.title = function () {return this.driver.getTitle();};
    },

    convertLocator: function(galenLocator) {
        if (galenLocator.type == "id") {
            return By.id(galenLocator.value);
        }
        else if (galenLocator.type == "css") {
            return By.cssSelector(galenLocator.value);
        }
        else if (galenLocator.type == "xpath") {
            return By.xpath(galenLocator.value);
        }
    },

    convertTimeToMillis: function (userTime) {
        if (typeof userTime == "string") {
            var number = parseInt(userTime);
            var type = userTime.replace(new RegExp("([0-9]| )", "g"), "");
            if (type == "") {
                return number;
            }
            else {
                if (type == "m") {
                    return number * 60000;
                }
                else if(type == "s") {
                    return number * 1000;
                }
                else throw  new Error("Cannot convert time. Uknown metric: " + type);
            }
        }
        else return userTime;
    },

    Wait: function (settings) {
        this.settings = settings;

        if (settings.time == undefined) {
            throw  new Error("time was not defined");
        }

        var period = settings.period;
        if (period == undefined) {
            period = 1000;
        }

        this.message = null;
        if (typeof settings.message == "string") {
            this.message = settings.message;
        }
        else this.message = "timeout error waiting for:"

        this.time = GalenPages.convertTimeToMillis(settings.time);
        this.period = GalenPages.convertTimeToMillis(period);

        //conditions is a map of functions which should return boolean
        this.untilAll = function (conditions) {
            var waitFuncs = [];
            for (var property in conditions) {
                if (conditions.hasOwnProperty(property)) {
                    var value = conditions[property];

                    waitFuncs[waitFuncs.length] = {
                        message: property,
                        func: value
                    };
                }
            }

            if (waitFuncs.length > 0) {
                var t = 0;
                while (t < this.time) {
                    t = t + this.period;
                    if (this._checkAll(waitFuncs)) {
                        return;
                    }
                    GalenPages.sleep(this.period);
                }

                var errors = "";
                for (var i = 0; i<waitFuncs.length; i++) {
                    if (!this._applyConditionFunc(waitFuncs[i].func)) {
                        errors = errors + "\n  - " + waitFuncs[i].message;
                    }
                }

                if (errors.length > 0) {
                    throw  new Error(this.message + errors);
                }
            }
            else throw  new Error("You are waiting for nothing");
        };
        this.forEach = function (items, itemConditionName, conditionFunc) {
            var conditions = {};
            for (var i=0; i<items.length; i++) {
                var name = "#" + (i+1) + " " + itemConditionName;
                conditions[name] = {
                    element: items[i],
                    conditionFunc: conditionFunc,
                    apply: function () {
                        return this.conditionFunc(this.element);
                    }
                };
            }

            this.untilAll(conditions);
        };

        this._checkAll = function (waitFuncs) {
            for (var i = 0; i<waitFuncs.length; i++) {
                if (!this._applyConditionFunc(waitFuncs[i].func)) {
                    return false;
                }
            }
            return true;
        };

        //Need this hack since sometimes it could be function and sometimes it could be an object with apply function inside
        this._applyConditionFunc = function (conditionFunc) {
            if (typeof conditionFunc == "function") {
                return conditionFunc();
            }
            else {
                return conditionFunc.apply();
            }
        };
    },
    wait: function (settings) {
        return new this.Wait(settings);
    },
    sleep: function (timeInMillis) {
        Thread.sleep(timeInMillis);
    }
};

(function (exports) {
    exports.GalenPages = GalenPages;
})(this);
