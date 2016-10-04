/// <reference path="typings/angularjs/angular.d.ts" />
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
            Tools.noop = angular.noop; // jshint ignore:line
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
///<reference path="./Tools.ts" />
// $log interceptor .. will send log data to application insights, once app insights is 
// registered. $provide is only available in the config phase, so we need to setup
// the decorator before app insights is instantiated.
var LogInterceptor = (function () {
    function LogInterceptor($provide, angular) {
        var _this = this;
        this._angular = angular;
        this._noop = this._angular.noop;
        // function to invoke ... initialized to noop
        LogInterceptor.interceptFuntion = this._noop;
        $provide.decorator('$log', [
            "$delegate", function ($delegate) {
                _this._debugFn = $delegate.debug;
                _this._infoFn = $delegate.info;
                _this._warnFn = $delegate.warn;
                _this._errorFn = $delegate.error;
                _this._logFn = $delegate.log;
                $delegate.debug = angular.extend(_this.delegator(_this._debugFn, 'debug'), _this._debugFn);
                $delegate.info = angular.extend(_this.delegator(_this._infoFn, 'info'), _this._infoFn);
                $delegate.warn = angular.extend(_this.delegator(_this._warnFn, 'warn'), _this._warnFn);
                $delegate.error = angular.extend(_this.delegator(_this._errorFn, 'error'), _this._errorFn);
                $delegate.log = angular.extend(_this.delegator(_this._logFn, 'log'), _this._logFn);
                return $delegate;
            }
        ]);
    }
    LogInterceptor.prototype.setInterceptFunction = function (func) {
        LogInterceptor.interceptFuntion = func;
    };
    LogInterceptor.prototype.getPrivateLoggingObject = function () {
        return {
            debug: Tools.isNullOrUndefined(this._debugFn) ? Tools.noop : this._debugFn,
            info: Tools.isNullOrUndefined(this._infoFn) ? Tools.noop : this._infoFn,
            warn: Tools.isNullOrUndefined(this._warnFn) ? Tools.noop : this._warnFn,
            error: Tools.isNullOrUndefined(this._errorFn) ? Tools.noop : this._errorFn,
            log: Tools.isNullOrUndefined(this._logFn) ? Tools.noop : this._logFn
        };
    };
    LogInterceptor.prototype.delegator = function (orignalFn, level) {
        var interceptingFn = function () {
            var args = [].slice.call(arguments);
            // track the call
            LogInterceptor.interceptFuntion(args[0], level);
            // Call the original 
            orignalFn.apply(null, args);
        };
        for (var n in orignalFn) {
            interceptingFn[n] = orignalFn[n];
        }
        return interceptingFn;
    };
    return LogInterceptor;
}());
/// <reference path="./Tools.ts" />
// Exception interceptor
// Intercepts calls to the $exceptionHandler and sends them to Application insights as exception telemetry.
var ExceptionInterceptor = (function () {
    function ExceptionInterceptor($provide) {
        var _this = this;
        ExceptionInterceptor.errorOnHttpCall = false;
        this._interceptFunction = Tools.noop;
        $provide.decorator('$exceptionHandler', [
            '$delegate', function ($delegate) {
                _this._origExceptionHandler = $delegate;
                return function (exception, cause) {
                    // track the call 
                    // ... only if there is no active issues/errors sending data over http, in order to prevent an infinite loop.
                    if (!ExceptionInterceptor.errorOnHttpCall) {
                        _this._interceptFunction(exception, cause);
                    }
                    // Call the original 
                    _this._origExceptionHandler(exception, cause);
                };
            }
        ]);
    }
    ExceptionInterceptor.prototype.setInterceptFunction = function (func) {
        this._interceptFunction = func;
    };
    ExceptionInterceptor.prototype.getPrivateExceptionHanlder = function () {
        return Tools.isNullOrUndefined(this._origExceptionHandler) ? Tools.noop : this._origExceptionHandler;
    };
    return ExceptionInterceptor;
}());
var Options = (function () {
    function Options() {
        this.applicationName = '';
        this.autoPageViewTracking = true;
        this.autoLogTracking = true;
        this.autoExceptionTracking = true;
        this.sessionInactivityTimeout = 1800000;
        this.instrumentationKey = '';
        this.developerMode = false;
    }
    return Options;
}());
var HttpRequest = (function () {
    function HttpRequest() {
    }
    HttpRequest.prototype.send = function (options, onSuccessCallback, onErrorCallback) {
        var request = new XMLHttpRequest();
        request.onerror = function (e) {
            onErrorCallback(0);
        };
        request.onload = function (e) {
            if (request.status == 200) {
                // success!
                onSuccessCallback();
            }
            else {
                onErrorCallback(request.status);
            }
        };
        request.open(options.method, options.url, true);
        for (var header in options.headers) {
            request.setRequestHeader(header, options.headers[header]);
        }
        request.send(JSON.stringify(options.data));
    };
    return HttpRequest;
}());
var HttpRequestOptions = (function () {
    function HttpRequestOptions() {
    }
    return HttpRequestOptions;
}());
/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
/// <reference path="./LogInterceptor.ts" />
/// <reference path="./ExceptionInterceptor.ts" />
/// <reference path="./Options.ts" />
/// <reference path="typings/appInsights/ai.d.ts" />
/// <reference path="./HTTPRequest.ts" />
var ApplicationInsights = (function () {
    function ApplicationInsights($location, logInterceptor, exceptionInterceptor, httpRequestFactory, options) {
        var _this = this;
        this._location = $location;
        this._httpRequestFactory = httpRequestFactory;
        this.options = options;
        this._log = logInterceptor.getPrivateLoggingObject();
        this._exceptionHandler = exceptionInterceptor.getPrivateExceptionHanlder();
        this._logInterceptor = logInterceptor;
        this._exceptionInterceptor = exceptionInterceptor;
        var snippet = {
            config: {
                instrumentationKey: this.options.instrumentationKey
            }
        };
        var init = new Microsoft.ApplicationInsights.Initialization(snippet);
        this.appInsights = init.loadAppInsights();
        // set traceTraceMessage as the intercept method of the log decorator
        if (this.options.autoLogTracking) {
            this._logInterceptor.setInterceptFunction(function (message, level, properties) { return _this.trackTraceMessage(message, level, properties); });
        }
        if (this.options.autoExceptionTracking) {
            this._exceptionInterceptor.setInterceptFunction(function (exception, cause) { return _this.trackException(exception, cause); });
        }
    }
    ApplicationInsights.prototype.trackTraceMessage = function (message, level, properties) {
        if (Tools.isNullOrUndefined(message) || !Tools.isString(message)) {
            return;
        }
        this.appInsights.trackTrace(message, properties);
    };
    ApplicationInsights.prototype.trackException = function (exception, cause) {
        if (Tools.isNullOrUndefined(exception)) {
            return;
        }
        this.appInsights.trackException(exception, "Unhandled");
        this.appInsights.stopTrackPage(this._location.path(), this._location.url());
        this.appInsights.context.operation = this.previousOperation;
    };
    return ApplicationInsights;
}());
/// <reference path="./ApplicationInsights.ts" />
var httpRequestService = angular.module("$$ApplicationInsights-HttpRequestModule", []);
httpRequestService.factory("$$applicationInsightsHttpRequestService", function () {
    return function () { return new HttpRequest(); };
});
// Application Insights Module
var angularAppInsights = angular.module("ApplicationInsightsModule", ["$$ApplicationInsights-HttpRequestModule"]);
var logInterceptor;
var exceptionInterceptor;
var tools = new Tools(angular);
//Removed for now because it dumps all telemetry under the page view which isn't ideal
//angularAppInsights.factory('httpRequestInterceptor', ['applicationInsightsService', (applicationInsightsService: ApplicationInsights) => ({
//    request(config) {
//        config.headers['X-Operation-Id'] = applicationInsightsService.appInsights.context.operation.id;
//        return config;
//    }
//})]);
// setup some features that can only be done during the configure pass
angularAppInsights.config([
    "$provide", "$httpProvider", function ($provide, $httpProvider) {
        logInterceptor = new LogInterceptor($provide, angular);
        exceptionInterceptor = new ExceptionInterceptor($provide);
        //$httpProvider.interceptors.push('httpRequestInterceptor');
    }
]);
angularAppInsights.provider("applicationInsightsService", function () { return new AppInsightsProvider(); });
// the run block sets up automatic page view tracking
angularAppInsights.run([
    "$rootScope", "$location", "applicationInsightsService",
    function ($rootScope, $location, applicationInsightsService) {
        $rootScope.$on("$stateChangeSuccess", function () {
            if (applicationInsightsService.options.autoPageViewTracking) {
                var newOperation = new Microsoft.ApplicationInsights.Context.Operation();
                newOperation.name = $location.path();
                applicationInsightsService.previousOperation = applicationInsightsService.appInsights.context.operation;
                applicationInsightsService.appInsights.context.operation = newOperation;
                applicationInsightsService.appInsights.startTrackPage($location.path());
            }
        });
        $rootScope.$on("$locationChangeSuccess", function () {
            if (applicationInsightsService.options.autoPageViewTracking) {
                applicationInsightsService.appInsights.stopTrackPage($location.path(), $location.url());
            }
        });
        $rootScope.$on("$routeChangeError", function (e, view) {
            applicationInsightsService.appInsights.stopTrackPage($location.path(), $location.url());
            applicationInsightsService.appInsights.context.operation = applicationInsightsService.previousOperation;
        });
    }
]);
var AppInsightsProvider = (function () {
    function AppInsightsProvider() {
        var _this = this;
        // configuration properties for the provider
        this._options = new Options();
        this.$get = ["$location", "$$applicationInsightsHttpRequestService", function ($location, $$applicationInsightsHttpRequestService) {
                return new ApplicationInsights($location, logInterceptor, exceptionInterceptor, $$applicationInsightsHttpRequestService, _this._options);
            }
        ];
    }
    AppInsightsProvider.prototype.configure = function (instrumentationKey, applicationName, enableAutoPageViewTracking, developerMode) {
        if (Tools.isString(applicationName)) {
            this._options.instrumentationKey = instrumentationKey;
            this._options.developerMode = developerMode;
            this._options.applicationName = applicationName;
            this._options.autoPageViewTracking = Tools.isNullOrUndefined(enableAutoPageViewTracking) ? true : enableAutoPageViewTracking;
        }
        else {
            Tools.extend(this._options, applicationName);
            this._options.instrumentationKey = instrumentationKey;
        }
    }; // invoked when the provider is run
    return AppInsightsProvider;
}());
//# sourceMappingURL=appinsights-angularjs.js.map