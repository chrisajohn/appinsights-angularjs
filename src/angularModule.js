var httpRequestService = angular.module("$$ApplicationInsights-HttpRequestModule", []);
httpRequestService.factory("$$applicationInsightsHttpRequestService", function () {
    return function () { return new HttpRequest(); };
});
var angularAppInsights = angular.module("ApplicationInsightsModule", ["$$ApplicationInsights-HttpRequestModule"]);
var logInterceptor;
var exceptionInterceptor;
var tools = new Tools(angular);
angularAppInsights.config([
    "$provide", "$httpProvider", function ($provide, $httpProvider) {
        logInterceptor = new LogInterceptor($provide, angular);
        exceptionInterceptor = new ExceptionInterceptor($provide);
    }
]);
angularAppInsights.provider("applicationInsightsService", function () { return new AppInsightsProvider(); });
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
    };
    return AppInsightsProvider;
}());
