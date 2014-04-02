// encapsulate functionality so nothing leaks out of the test
(function(){
	var dummyAjaxData = {
		total : 5,
		rows : [
			{ id : 1, value : Math.random() },
			{ id : 1, value : Math.random() },
			{ id : 1, value : Math.random() },
			{ id : 1, value : Math.random() },
			{ id : 1, value : Math.random() },
		]
	};

	module("milestone v0.1.6");
	asyncTest("Add auto load option - testing for true.",function(){
		expect(2);

		var 
			dummyUrl = 'test-auto-load-for-true', // must have unique URLs for async tests
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseTime : 1,
				response : function(){
					ok(true,"mockjax hit.");
					this.responseText = dummyAjaxData;

				}		
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url,
				autoLoad : true,
				done : function (argument) {
					ok(true,"done hit.");
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		// viewModel.afterRender doesn't fire automatically from the viewModel, it fires on the template's 'afterRender' event
		// give the ajax call 100 milliseconds to fire the viewModel.afterRender manually
		setTimeout(function(){
			viewModel.afterRender();
			$.mockjax(mockAjax);
			start();
		},10);
	});


	asyncTest("Add auto load option - testing for false.",function(){
		expect(1);

		var 
			dummyUrl = 'test-auto-load-for-false', // must have unique URLs for async tests
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseTime : 1,
				response : function(){
					ok(false,"mockjax hit.");
					this.responseText = dummyAjaxData;
				}		
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : false,
				done : function (argument) {
					ok(true,"done hit.");
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		// viewModel.afterRender doesn't fire automatically from the viewModel, it fires on the template's 'afterRender' event
		// give the ajax call 100 milliseconds to fire the viewModel.afterRender manually
		setTimeout(function(){
			viewModel.afterRender();
			$.mockjax(mockAjax);
			start();
		},10);
	});


	test("Messages display on different states.",function(){

	});


	test("Backwards compatibility with old 'noRows' option property",function(){

	});
	test("Create functions for accessing rows and dataset total from response",function(){

	});
	test("Add the utils as the second argument of the 'done' event",function(){

	});
	test("Add on row click event",function(){

	});
})();