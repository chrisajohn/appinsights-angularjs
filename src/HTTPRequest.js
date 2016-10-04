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
