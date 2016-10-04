var StackParser = (function () {
    function StackParser() {
    }
    StackParser.parse = function (error) {
        if (typeof error.stacktrace !== "undefined" || typeof error["opera#sourceloc"] !== "undefined") {
            return StackParser.parseOpera(error);
        }
        else if (error.stack && error.stack.match(StackParser.chromeIeStackRegexp)) {
            return StackParser.parseChromeOrInternetExplorer(error);
        }
        else if (error.stack && error.stack.match(StackParser.firefoxSafariStackRegexp)) {
            return StackParser.parseFireFoxOrSafari(error);
        }
        else {
            return null;
        }
    };
    StackParser.extractLocation = function (urlLike) {
        if (urlLike.indexOf(":") === -1) {
            return [];
        }
        var locationParts = urlLike.split(":");
        var lastNumber = locationParts.pop();
        var possibleNumber = locationParts[locationParts.length - 1];
        if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
            var lineNumber = locationParts.pop();
            return [locationParts.join(":"), lineNumber, lastNumber];
        }
        else {
            return [locationParts.join(":"), lastNumber, undefined];
        }
    };
    StackParser.parseChromeOrInternetExplorer = function (error) {
        var _this = this;
        var level = 0;
        return error.stack.split("\n").slice(1).map(function (line) {
            var tokens = line.replace(/^\s+/, "").split(/\s+/).slice(1);
            var locationParts = tokens[0] !== undefined ? _this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, "")) : ["unknown", "unknown", "unknown"];
            var functionName = (!tokens[0] || tokens[0] === "Anonymous") ? "unknown" : tokens[0];
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    };
    StackParser.parseFireFoxOrSafari = function (error) {
        var _this = this;
        var level = 0;
        return error.stack.split("\n").filter(function (line) {
            return !!line.match(StackParser.firefoxSafariStackRegexp);
        }, this).map(function (line) {
            var tokens = line.split("@");
            var locationParts = _this.extractLocation(tokens.pop());
            var functionName = tokens.shift() || "unknown";
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    };
    StackParser.parseOpera = function (e) {
        if (!e.stacktrace || (e.message.indexOf("\n") > -1 &&
            e.message.split("\n").length > e.stacktrace.split("\n").length)) {
            return this.parseOpera9(e);
        }
        else if (!e.stack) {
            return this.parseOpera10(e);
        }
        else {
            return this.parseOpera11(e);
        }
    };
    StackParser.parseOpera9 = function (e) {
        var lineRe = /Line (\d+).*script (?:in )?(\S+)/i;
        var lines = e.message.split("\n");
        var result = [];
        for (var i = 2, len = lines.length; i < len; i += 2) {
            var match = lineRe.exec(lines[i]);
            if (match) {
                var level = 0;
                result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, level++));
            }
        }
        return result;
    };
    StackParser.parseOpera10 = function (e) {
        var lineRe = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        var lines = e.stacktrace.split("\n");
        var result = [];
        for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRe.exec(lines[i]);
            if (match) {
                var level = 0;
                result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, level++));
            }
        }
        return result;
    };
    StackParser.parseOpera11 = function (error) {
        var level = 0;
        return error.stack.split("\n").filter(function (line) {
            return !!line.match(StackParser.firefoxSafariStackRegexp) &&
                !line.match(/^Error created at/);
        }, this).map(function (line) {
            var tokens = line.split("@");
            var locationParts = StackParser.extractLocation(tokens.pop());
            var functionCall = (tokens.shift() || "");
            var functionName = functionCall
                .replace(/<anonymous function(: (\w+))?>/, "$2")
                .replace(/\([^\)]*\)/g, "") || undefined;
            var argsRaw;
            if (functionCall.match(/\(([^\)]*)\)/)) {
                argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, "$1");
            }
            var args = (argsRaw === undefined || argsRaw === "[arguments not available]") ? undefined : argsRaw ? argsRaw.split(",") : "";
            return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    };
    StackParser.firefoxSafariStackRegexp = /\S+\:\d+/;
    StackParser.chromeIeStackRegexp = /\s+at /;
    return StackParser;
}());
