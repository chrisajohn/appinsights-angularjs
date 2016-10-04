var AppInsightsStorage = (function () {
    function AppInsightsStorage(settings) {
        var _this = this;
        this._config = Tools.extend(AppInsightsStorage.defaultConfig, settings);
        this._self = this._config;
        this._prefix = this._config.prefix;
        this._cookie = this._config.cookie;
        this._notify = this._config.notify;
        this._storageType = this._config.storageType;
        this._$rootScope = this._config.rootScope;
        this._$window = this._config.window;
        this._$document = this._config.document;
        this._$parse = this._config.parse;
        if (!this._$document) {
            this._$document = document;
        }
        else if (this._$document[0]) {
            this._$document = this._$document[0];
        }
        if (this._prefix.substr(-1) !== ".") {
            this._prefix = !!this._prefix ? this._prefix + "." : "";
        }
        this._deriveQualifiedKey = function (key) {
            return _this._prefix + key;
        };
    }
    AppInsightsStorage.prototype.isStringNumber = function (num) {
        return /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ""));
    };
    AppInsightsStorage.prototype.browserSupportsLocalStorage = function () {
        try {
            var supported = (this._storageType in this._$window && this._$window[this._storageType] !== null);
            var key = this._deriveQualifiedKey("__" + Math.round(Math.random() * 1e7));
            if (supported) {
                this._webStorage = this._$window[this._storageType];
                this._webStorage.setItem(key, "");
                this._webStorage.removeItem(key);
            }
            return supported;
        }
        catch (e) {
            this._storageType = "cookie";
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return false;
        }
    };
    AppInsightsStorage.prototype.browserSupportsCookies = function () {
        try {
            return this._$window.navigator.cookieEnabled ||
                ("cookie" in this._$document && (this._$document.cookie.length > 0 ||
                    (this._$document.cookie = "test").indexOf.call(this._$document.cookie, "test") > -1));
        }
        catch (e) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return false;
        }
    };
    AppInsightsStorage.prototype.addToCookies = function (key, value) {
        if (Tools.isUndefined(value)) {
            return false;
        }
        else if (Tools.isArray(value) || Tools.isObject(value)) {
            value = Tools.toJson(value);
        }
        if (!this.browserSupportsCookies) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", "COOKIES_NOT_SUPPORTED");
            return false;
        }
        try {
            var expiry = "", expiryDate = new Date(), cookieDomain = "";
            if (value === null) {
                expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
                expiry = "; expires=" + expiryDate.toUTCString();
                value = "";
            }
            else if (this._cookie.expiry !== 0) {
                expiryDate.setTime(expiryDate.getTime() + (this._cookie.expiry * 24 * 60 * 60 * 1000));
                expiry = "; expires=" + expiryDate.toUTCString();
            }
            if (!!key) {
                var cookiePath = "; path=" + this._cookie.path;
                if (this._cookie.domain) {
                    cookieDomain = "; domain=" + this._cookie.domain;
                }
                this._$document.cookie = this._deriveQualifiedKey(key) + "=" + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
            }
        }
        catch (e) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return false;
        }
        return true;
    };
    AppInsightsStorage.prototype.getFromCookies = function (key) {
        if (!this.browserSupportsCookies) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", "COOKIES_NOT_SUPPORTED");
            return false;
        }
        var cookies = this._$document.cookie && this._$document.cookie.split(";") || [];
        for (var i = 0; i < cookies.length; i++) {
            var thisCookie = cookies[i];
            while (thisCookie.charAt(0) === " ") {
                thisCookie = thisCookie.substring(1, thisCookie.length);
            }
            if (thisCookie.indexOf(this._deriveQualifiedKey(key) + "=") === 0) {
                var storedValues = decodeURIComponent(thisCookie.substring(this._prefix.length + key.length + 1, thisCookie.length));
                try {
                    var obj = JSON.parse(storedValues);
                    return Tools.fromJson(obj);
                }
                catch (e) {
                    return storedValues;
                }
            }
        }
        return null;
    };
    AppInsightsStorage.prototype.addToLocalStorage = function (key, value) {
        if (Tools.isUndefined(value)) {
            value = null;
        }
        else if (Tools.isObject(value) || Tools.isArray(value) || Tools.isNumber(+value || value)) {
            value = Tools.toJson(value);
        }
        if (!this.browserSupportsLocalStorage() || this._self.storageType === "cookie") {
            if (!this.browserSupportsLocalStorage()) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.warning", "LOCAL_STORAGE_NOT_SUPPORTED");
            }
            if (this._notify.setItem) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.setitem", { key: key, newvalue: value, storageType: "cookie" });
            }
            return this.addToCookies(key, value);
        }
        try {
            if (Tools.isObject(value) || Tools.isArray(value)) {
                value = Tools.toJson(value);
            }
            if (this._webStorage) {
                this._webStorage.setItem(this._deriveQualifiedKey(key), value);
            }
            if (this._notify.setItem) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.setitem", { key: key, newvalue: value, storageType: this._self.storageType });
            }
        }
        catch (e) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return this.addToCookies(key, value);
        }
        return true;
    };
    AppInsightsStorage.prototype.getFromLocalStorage = function (key) {
        if (!this.browserSupportsLocalStorage() || this._self.storageType === "cookie") {
            if (!this.browserSupportsLocalStorage()) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.warning", "LOCAL_STORAGE_NOT_SUPPORTED");
            }
            return this.getFromCookies(key);
        }
        var item = this._webStorage ? this._webStorage.getItem(this._deriveQualifiedKey(key)) : null;
        if (!item || item === "null") {
            return null;
        }
        if (item.charAt(0) === "{" || item.charAt(0) === "[" || this.isStringNumber(item)) {
            return Tools.fromJson(item);
        }
        return item;
    };
    AppInsightsStorage.prototype.getStorageType = function () {
        return this._storageType;
    };
    AppInsightsStorage.prototype.isSupported = function () {
        return this.browserSupportsLocalStorage();
    };
    AppInsightsStorage.prototype.set = function (key, value) {
        return this.addToLocalStorage(key, value);
    };
    AppInsightsStorage.prototype.get = function (key) {
        return this.getFromLocalStorage(key);
    };
    AppInsightsStorage.prototype.deriveKey = function (key) {
        return this._deriveQualifiedKey(key);
    };
    AppInsightsStorage.prototype.isCookiesSupported = function () {
        return this.browserSupportsCookies();
    };
    AppInsightsStorage.prototype.setCookie = function (key, value) {
        this.addToCookies(key, value);
    };
    AppInsightsStorage.prototype.getCookie = function (key) {
        return this.getFromCookies(key);
    };
    AppInsightsStorage.defaultConfig = {
        prefix: "ls",
        storageType: "localStorage",
        cookie: {
            expiry: 30,
            path: "/"
        },
        notify: {
            setItem: true,
            removeItem: false
        }
    };
    return AppInsightsStorage;
}());
