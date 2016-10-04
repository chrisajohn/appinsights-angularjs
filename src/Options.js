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
