var LogInterceptor = (function () {
    function LogInterceptor($provide, angular) {
        var _this = this;
        this._angular = angular;
        this._noop = this._angular.noop;
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
            LogInterceptor.interceptFuntion(args[0], level);
            orignalFn.apply(null, args);
        };
        for (var n in orignalFn) {
            interceptingFn[n] = orignalFn[n];
        }
        return interceptingFn;
    };
    return LogInterceptor;
}());
