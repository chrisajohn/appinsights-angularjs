var StackFrame = (function () {
    function StackFrame(functionName, args, fileName, lineNumber, columnNumber, level) {
        if (!Tools.isUndefined(functionName)) {
            this.setFunctionName(functionName);
        }
        if (!Tools.isUndefined(columnNumber)) {
            this.setColumnNumber(columnNumber);
        }
        if (!Tools.isUndefined(args)) {
            this.setArgs(args);
        }
        if (!Tools.isUndefined(fileName)) {
            this.setFileName(fileName);
        }
        if (!Tools.isUndefined(lineNumber)) {
            this.setLineNumber(lineNumber);
        }
        if (!Tools.isUndefined(level)) {
            this.setLevelNumber(level);
        }
    }
    StackFrame.prototype.setFunctionName = function (v) {
        this.method = String(v);
    };
    StackFrame.prototype.setArgs = function (v) {
        if (Object.prototype.toString.call(v) !== '[object Array]') {
            throw new TypeError('Args must be an Array');
        }
        this.args = v;
    };
    StackFrame.prototype.setFileName = function (v) {
        this.fileName = String(v);
    };
    StackFrame.prototype.setLineNumber = function (v) {
        if (!Tools.isNumber(v)) {
            console.log('LineNumber is ' + v);
            this.lineNumber = undefined;
            return;
        }
        this.lineNumber = Number(v);
    };
    StackFrame.prototype.setColumnNumber = function (v) {
        if (!Tools.isNumber(v)) {
            this.columnNumber = undefined;
            return;
        }
        this.columnNumber = Number(v);
    };
    StackFrame.prototype.setLevelNumber = function (v) {
        if (!Tools.isNumber(v)) {
            throw new TypeError('Level Number must be a Number');
        }
        this.level = Number(v);
    };
    StackFrame.prototype.toString = function () {
        var functionName = this.method || '{anonymous}';
        var args = '(' + (this.args || []).join(',') + ')';
        var fileName = this.fileName ? ('@' + this.fileName) : '';
        var lineNumber = Tools.isNumber(this.lineNumber) ? (':' + this.lineNumber) : '';
        var columnNumber = Tools.isNumber(this.columnNumber) ? (':' + this.columnNumber) : '';
        return functionName + args + fileName + lineNumber + columnNumber;
    };
    return StackFrame;
}());
