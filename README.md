

appinsights-angularjs
===========================

An implementation of Microsoft Application Insights utilizing the offical Application Insights Javascript SDK.

## Getting Started

##### Prerequisites

- A Microsoft Application Insights Instrumentation Key:
    - This can be obtained from https://portal.azure.com, and registering an Application Insights resource.
    - A guide based on the latest portal update : [Obtaining An Application Insights Instrumentation Key](http://kenhaines.net/getting-an-application-insights-instrumentation-key/) 


###Installation

####Via Package 

##### Bower
```
bower install appinsights-angularjs
```

##### NPM
```
npm i appinsights-angularjs
```

##### Nuget
```
Install-Package appinsights-angularjs
```

####From Source
```
> git clone https://github.com/chrisajohn/appinsights-angularjs.git
> cd appinsights-angularjs
> npm install
> grunt
```
Note: the appinsights-angularjs.js file will be in the **build/** folder after running *grunt*.


###Setup

Add a reference to the *app insights cdn* file in your main html file:
```HTML
   <!-- load application insights via CDN -->
   <script src="https://az416426.vo.msecnd.net/scripts/a/ai.0.js"></script>
```
Require the following resource:
```Javascript
require('appinsights-angularjs');
```
Configure the provider during your application module's config phase:
```Javascript
	angular.module('awesome.app', [
    'ApplicationInsightsModule'
	]);
	
	app.config(['applicationInsightsServiceProvider', (applicationInsightsServiceProvider) => {

    var options = { applicationName: 'awesome.app' };

    var seedProInstrumentationKey = 'KEY HERE';

    applicationInsightsServiceProvider.configure(seedProInstrumentationKey, options);
}]);
	
```
 Basic automatic telemetry will be gathered out of the box, but for a direct reference inject the _applicationInsightsService_ into your code:
```Javascript
	amazingApp.controller('mainController',['applicationInsightsService',function(applicationInsightsService){
	applicationInsightsService.trackEvent('An amazing Event happened');
}]);

```

###Configuration
The options object passed to the _**configure**( iKey, options )_  has a number of valid settings. Their names and default values are as follows:
```Javascript
var options = {
	// applicationName: used as a 'friendly name' prefix to url paths
	// ex: myAmazingapp/mainView
	applicationName:'',
	// autoPageViewTracking: enables the sending a event to Application Insights when 
	// ever the $locationChangeSuccess event is fired on the rootScope
	autoPageViewTracking: true,
	// autoLogTracking: enables the interception of calls to the $log service and have the trace 
	// data sent to Application Insights.
	autoLogTracking: true,
	// autoExceptionTracking: enables calls to the $exceptionHandler service, usually unhandled exceptions, to have the error and stack data sent to Application Insights.
	autoExceptionTracking: true,
	// sessionInactivityTimeout: The time (in milliseconds) that a user session can be inactive, before a new session will be created (on the next api call). Default is 30mins.
	sessionInactivityTimeout: 1800000,
	// developerMode: Makes the service not post anything to AI but print it to the console instead
	developerMode: true
	};
	
```
