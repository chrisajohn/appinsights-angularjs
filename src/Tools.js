var Tools = (function () {
    function Tools(angular) {
        Tools.isDefined = angular.isDefined,
            Tools.isUndefined = angular.isUndefined,
            Tools.isObject = angular.isObject,
            Tools.isArray = angular.isArray,
            Tools.isString = angular.isString,
            Tools.extend = angular.extend,
            Tools.toJson = angular.toJson,
            Tools.fromJson = angular.fromJson,
            Tools.forEach = angular.forEach,
            Tools.noop = angular.noop;
    }
    Tools.isNullOrUndefined = function (val) {
        return Tools.isUndefined(val) || val === null;
    };
    Tools.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    Tools.generateGuid = function () {
        var value = [];
        var digits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            value[i] = digits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        value[8] = value[13] = value[18] = value[23] = "-";
        value[14] = "4";
        value[19] = digits.substr((value[19] & 0x3) | 0x8, 1);
        return value.join("");
    };
    return Tools;
}());
