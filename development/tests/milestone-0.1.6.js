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
	var makeAjaxUrl = function (argument) {
		return "ajax" + Math.floor(Math.random() * 10000000).toString();
	};



	module("milestone v0.1.6");
	asyncTest("Add auto load option - testing for true.",function(){
		expect(2);

		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
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
			$.mockjaxClear(mockAjax); // clean up
			start();
		},10);
	});


	asyncTest("Add auto load option - testing for false.",function(){
		expect(1);

		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
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
			$.mockjaxClear(mockAjax); // clean up
			start();
		},10);
	});

	test("Messages display on different states - initial message",function(){
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : false, // we're going to turn off auto load so we can test the inital message,
				messages : {
					initial : "This is my initial message."
				},
				done : function (argument) {
					ok(true,"done hit.");
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.noneText(),options.messages.initial, "none text matches 'initial' message.");
	});

	test("Messages display on different states - no rows message",function(){
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseText : { rows : [], total : 0 }
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : true, // auto load for this test,
				async : false,
				messages : {
					initial : "unexpected value, initial message",
					noRows : "exepected value"
				}
			};
		var viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.noneText(),options.messages.noRows, "none text matches 'noRows' message.");
		$.mockjaxClear(mockAjax); // clean up
	});

	test("Messages display on different states - error message",function(){
		expect(1);
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			mockAjax = $.mockjax({
				url : dummyUrl,
				status : 500,
				responseText : "Unexpected response"
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : true, // auto load for this test
				async : false, // to make it easier to test, allow the request to be async
				noRows :  "expected value",
				messages : {
					initial : "unexpected value, initial message",
					noRows : "unexpected value, messages.noRows",
					loading : "unexpected value, messages.loading",
					error : "expected value"
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.noneText(),options.messages.error, "none text matches 'error' message.");
		$.mockjaxClear(mockAjax); // clean up
	});

	test("Messages display on different states - error message as function",function(){
		expect(2);
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			expectedMessage = "this is my expected message",
			mockAjax = $.mockjax({
				url : dummyUrl,
				status : 500,
				responseText : "Unexpected response"
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : true, // auto load for this test
				async : false, // to make it easier to test, allow the request to be async
				noRows :  "expected value",
				messages : {
					initial : "unexpected value, initial message",
					noRows : "unexpected value, messages.noRows",
					loading : "unexpected value, messages.loading",
					error : function(xhr){
						ok(xhr.responseText);
						return expectedMessage;
					}
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.noneText(),expectedMessage, "none text matches 'error' message.");
		$.mockjaxClear(mockAjax); // clean up
	});

	asyncTest("Messages display on different states - loading message",function(){
		expect(1);
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseTime: 100,
				responseText : { rows : [], total : 0 }
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : true, // auto load for this test
				async : false, // to make it easier to test, allow the request to be async
				noRows :  "expected value",
				messages : {
					initial : "unexpected value, initial message",
					noRows : "unexpected value, messages.noRows",
					loading : "expected value"
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		setTimeout(function (argument) {
			equal(viewModel.noneText(),options.messages.loading, "none text matches 'noRows' message.");
			$.mockjaxClear(mockAjax); // clean up
			start();
		},50);
	});

	test("Backwards compatibility with old 'noRows' option property",function(){
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseText : { rows : [], total : 0 }
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				autoLoad : true, // auto load for this test
				async : false, // to make it easier to test, allow the request to be async
				noRows :  "expected value",
				messages : {
					initial : "unexpected value, initial message",
					noRows : "unexpected value, messages.noRows"
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.noneText(),options.noRows, "none text matches 'noRows' message.");
	});


	test("Create functions for accessing rows and dataset total from response - base function",function(){
		expect(8);
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			expectedRows = dummyAjaxData.rows,
			expectedTotal = dummyAjaxData.total
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseText : dummyAjaxData
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				async : false, // to make it easier to test, allow the request to be async
				getRows : function (data,xhr) {
					equal(data.rows.length,dummyAjaxData.rows.length,"data rows has expected length");
					equal(data.total,expectedTotal,"data total has expected value");
					ok(xhr.responseText, "xhr.responseText is not null");
					return data.rows;

				},
				getTotal : function(data,xhr){
					equal(data.rows.length,dummyAjaxData.rows.length,"data rows has expected length");
					equal(data.total,expectedTotal,"data total has expected value");
					ok(xhr.responseText, "xhr.responseText is not null");
					return data.total;
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.rows().length,expectedRows.length, "rows match expected value.");
		equal(viewModel.total(),expectedTotal, "total match expected value.");
	});



	test("Create functions for accessing rows and dataset total from response - total in headers",function(){
		expect(6);
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests
			expectedRows = [ // seven rows
				{ id : 1, value : Math.random() },
				{ id : 2, value : Math.random() },
				{ id : 3, value : Math.random() },
				{ id : 4, value : Math.random() },
				{ id : 5, value : Math.random() },
				{ id : 6, value : Math.random() },
				{ id : 7, value : Math.random() }
			],
			expectedTotal = Math.round(Math.random() * 1000),
			mockAjax = $.mockjax({
				url : dummyUrl,
				headers : { 'x-response-total' : expectedTotal },
				responseText : expectedRows
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				async : false, // to make it easier to test, allow the request to be async
				getRows : function (data,xhr) {
					ok(xhr.responseText, "xhr.responseText is not null");
					ok(_.isArray(data), "data is an array");
					return data;

				},
				getTotal : function(data,xhr){
					ok(_.isFunction(xhr.getResponseHeader),"get getResponseHeader exists in xhr");
					var actualTotal = xhr.getResponseHeader('x-response-total');
					equal(expectedTotal,actualTotal);
					return actualTotal;
				}
			},
			viewModel = new ViewModel(options,undefined,{}); // instantiate a new view model

		equal(viewModel.rows().length,expectedRows.length, "rows match expected value.");
		equal(viewModel.total(),expectedTotal, "total match expected value.");
	});


	asyncTest("Add the utils as the second argument of the 'done' event",function(){
		expect(2);
		var
			dummyUrl = makeAjaxUrl(), // must have unique URLs for async tests,
			element = $("<div></div>");
			mockAjax = $.mockjax({
				url : dummyUrl,
				responseText : dummyAjaxData
			}),
			options = {
				url : dummyUrl, // we're testing ajax, use a url
				done : function (actualElement,utils) {
					equal(element,actualElement,"element matches expected value");
					equal(utils,viewModel.utils,"utils matches expected value");
					start();
				}
			},
			viewModel = new ViewModel(options,element,{}); // instantiate a new view model

		viewModel.afterRender();
	});
	test("Adding format to column",function(){
		var
			expected = "txet modnar",
			element = $("<div></div>")[0],
			valueAccessor = ko.observable(12345),
			allBindings = ko.observable({}),
			viewModel = {},
			bindingContext = {
				$root:  new ViewModel({
					url : 'whatever'
				}),
				$parent: {
					"id" : 1,
					"date" : new Date('12/25/2014'),
					"text" : "random text"
				},
				$data: {
					key : "text",
					format : function(cellData){
						equal(bindingContext.$data.text);
						return cellData.split("").reverse().join("");
					}
				},
				$parentContext : {
					$index : ko.observable(1),
				},
				$index : ko.observable(1),
				extend : function(){
					return bindingContext;
				}
			};

		// This method throws errors if you're not passing in a real bindingContext for unit testing. The result will come back in the exception, assert against that.
		try{
			ko.bindingHandlers.kogrid$cell.init(element,valueAccessor,allBindings,viewModel,bindingContext);
		} catch (e) {
			equal(expected,e._result);
		}
	});
	asyncTest("Shrink to fit",function(){
		expect(2);
		equal("auto",defaultOptions.height,"Default height option set to auto");

		// create a virtual node to bind against
		var node = $("<div data-bind='kogrid : $data'></div>");
		var viewModel = {
			rows : ko.observableArray([
				{ id : 1, text : "control" },
				{ id : 1, text : undefined },
				{ id : 1, text : null },
			]),
			columns : [
				{ title : "id" , key : "id" },
				{ title : "text" , key : "text" },
			],
			height : "shrink"
		};
		ko.applyBindings(viewModel,node[0]);

		// the shrink to fit class doesn't get added until after render, do an async assert
		setTimeout(function(){
			ok(node.hasClass("ko-grid-shrink-to-fit"),"CSS class shrink to fit has been added.");
			start();
		},0);
	});

	// already implemented, but need tests
	test("Add async to the ajax options",function(){

	});
	test("Add clear to utils",function(){

	});
	test("Make sure messages merge properly",function(){

	});

	// new features
	test("Add on global row click event",function(){
		// is this necassary?  Will this give me any specific advantage over individual row click events?
	});
	test("Add global formatter",function(){
		// if string is passed in as the column format, use the global formatter defined in the options
	});
})();