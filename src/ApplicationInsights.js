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
