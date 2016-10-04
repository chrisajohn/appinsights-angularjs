var ExceptionInterceptor = (function () {
    function ExceptionInterceptor($provide) {
        var _this = this;
        ExceptionInterceptor.errorOnHttpCall = false;
        this._interceptFunction = Tools.noop;
        $provide.decorator('$exceptionHandler', [
            '$delegate', function ($delegate) {
                _this._origExceptionHandler = $delegate;
                return function (exception, cause) {
                    if (!ExceptionInterceptor.errorOnHttpCall) {
                        _this._interceptFunction(exception, cause);
                    }
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
