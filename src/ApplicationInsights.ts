/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
/// <reference path="./LogInterceptor.ts" />
/// <reference path="./ExceptionInterceptor.ts" />
/// <reference path="./Options.ts" />
/// <reference path="typings/appInsights/ai.d.ts" />
/// <reference path="./HTTPRequest.ts" />
class ApplicationInsights {

    private _location: angular.ILocationService;
    private _httpRequestFactory: () => IHttpRequest;

    private _log: any;
    private _exceptionHandler: any;

    private _logInterceptor: LogInterceptor;
    private _exceptionInterceptor: ExceptionInterceptor;
    options: Options;

    appInsights: Microsoft.ApplicationInsights.AppInsights;
    previousOperation: Microsoft.ApplicationInsights.Context.Operation;

    constructor($location: angular.ILocationService,
        logInterceptor: LogInterceptor,
        exceptionInterceptor: ExceptionInterceptor,
        httpRequestFactory: () => IHttpRequest,
        options: Options) {

        this._location = $location;
        this._httpRequestFactory = httpRequestFactory;
        this.options = options;
        this._log = logInterceptor.getPrivateLoggingObject();
        this._exceptionHandler = exceptionInterceptor.getPrivateExceptionHanlder();
        this._logInterceptor = logInterceptor;
        this._exceptionInterceptor = exceptionInterceptor;

        var snippet: any = {
            config: {
                instrumentationKey: this.options.instrumentationKey
            }
        };

        var init = new Microsoft.ApplicationInsights.Initialization(snippet);
        this.appInsights = init.loadAppInsights();

        // set traceTraceMessage as the intercept method of the log decorator
        if (this.options.autoLogTracking) {
            this._logInterceptor.setInterceptFunction((message, level, properties?) => this.trackTraceMessage(message, level, properties));
        }
        if (this.options.autoExceptionTracking) {
            this._exceptionInterceptor.setInterceptFunction((exception, cause) => this.trackException(exception, cause));
        }

    }

    trackTraceMessage(message, level, properties?) {
        if (Tools.isNullOrUndefined(message) || !Tools.isString(message)) {
            return;
        }

        this.appInsights.trackTrace(message, properties);
    }

    trackException(exception, cause) {
        if (Tools.isNullOrUndefined(exception)) {
            return;
        }

        this.appInsights.trackException(exception, "Unhandled");
        this.appInsights.stopTrackPage(this._location.path(), this._location.url());
        this.appInsights.context.operation = this.previousOperation;

    }

}