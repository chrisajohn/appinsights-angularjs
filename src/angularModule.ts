/// <reference path="./ApplicationInsights.ts" />
declare var angular: angular.IAngularStatic;

var httpRequestService = angular.module("$$ApplicationInsights-HttpRequestModule", []);
httpRequestService.factory("$$applicationInsightsHttpRequestService", () => {
    return () => new HttpRequest();
});


// Application Insights Module
var angularAppInsights = angular.module("ApplicationInsightsModule", ["$$ApplicationInsights-HttpRequestModule"]);
var logInterceptor: LogInterceptor;
var exceptionInterceptor: ExceptionInterceptor;
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
    "$provide", "$httpProvider", ($provide, $httpProvider) => {
        logInterceptor = new LogInterceptor($provide, angular);
        exceptionInterceptor = new ExceptionInterceptor($provide);
        //$httpProvider.interceptors.push('httpRequestInterceptor');
    }
]);


angularAppInsights.provider("applicationInsightsService", () => new AppInsightsProvider());

// the run block sets up automatic page view tracking
angularAppInsights.run([
    "$rootScope", "$location", "applicationInsightsService",
    ($rootScope, $location, applicationInsightsService: ApplicationInsights) => {

        $rootScope.$on("$stateChangeSuccess", () => {

            if (applicationInsightsService.options.autoPageViewTracking) {

                const newOperation = new Microsoft.ApplicationInsights.Context.Operation();
                newOperation.name = $location.path();

                applicationInsightsService.previousOperation = applicationInsightsService.appInsights.context.operation;
                applicationInsightsService.appInsights.context.operation = newOperation;

                applicationInsightsService.appInsights.startTrackPage($location.path());
            }

        });

        $rootScope.$on("$locationChangeSuccess", () => {


            if (applicationInsightsService.options.autoPageViewTracking) {
                applicationInsightsService.appInsights.stopTrackPage($location.path(), $location.url());
            }
        });

        $rootScope.$on("$routeChangeError", (e, view) => {

            applicationInsightsService.appInsights.stopTrackPage($location.path(), $location.url());
            applicationInsightsService.appInsights.context.operation = applicationInsightsService.previousOperation;

        });

    }
]);

class AppInsightsProvider implements angular.IServiceProvider {
    // configuration properties for the provider
    private _options = new Options();

    configure(instrumentationKey, applicationName, enableAutoPageViewTracking, developerMode) {
        if (Tools.isString(applicationName)) {
            this._options.instrumentationKey = instrumentationKey;
            this._options.developerMode = developerMode;
            this._options.applicationName = applicationName;
            this._options.autoPageViewTracking = Tools.isNullOrUndefined(enableAutoPageViewTracking) ? true : enableAutoPageViewTracking;
        } else {
            Tools.extend(this._options, applicationName);
            this._options.instrumentationKey = instrumentationKey;
        }
    } // invoked when the provider is run
    $get = ["$location", "$$applicationInsightsHttpRequestService", ($location, $$applicationInsightsHttpRequestService) => {

        return new ApplicationInsights($location, logInterceptor, exceptionInterceptor, $$applicationInsightsHttpRequestService, this._options);
    }
    ];


}