// encapsulate functionality so nothing leaks out of the test
(function(){
	module("milestone v0.1.6 - bugs");
	test("Bug: [Object Window] appearing in grid when value is undefined",function(){
		var
			boundFunction = bindThis(undefined);
			boundValue = boundFunction();
		ok(_.isFunction(boundFunction));
		ok(_.isUndefined(boundValue));
	});
	test("Bug: [Object Window] appearing in grid when value is null",function(){
		var
			boundFunction = bindThis(null);
			boundValue = boundFunction();
		ok(_.isFunction(boundFunction));
		ok(_.isNull(boundValue));
	});
	test("Bug: Grid defaults to zero pages",function(){
		var
			options = {
				rows : ko.observableArray(),
				columns : [
					{ title : "id" , key : "id" },
					{ title : "text" , key : "text" },
				]
			},
			viewModel = new ViewModel(options,undefined,{});
		equal(viewModel.pageIndex(),0,"page index is 0 with no rows");

		options.rows.push({ id : 1, text : "control" });
		equal(viewModel.pageIndex(),1,"page index is 1 after adding rows");
	});
	test("Bug: Add grid nav buttons do nothing if there are no pages or records",function(){
		var
			options = {
				rows : ko.observableArray(),
				columns : [
					{ title : "id" , key : "id" },
					{ title : "text" , key : "text" },
				]
			},
			viewModel = new ViewModel(options,undefined,{});
		ok(!viewModel.isPreviousEnabled(),"Previous disabled - no rows");
		ok(!viewModel.isNextEnabled(),"Next disabled - no rows");
		ok(!viewModel.isGoToPageEnabled(),"Go to page disabled - no rows");


		options.rows.push({ id : 1 , text : "control" });
		ok(!viewModel.isPreviousEnabled(),"Previous disabled - one row");
		ok(!viewModel.isNextEnabled(),"Next disabled - one row");
		ok(viewModel.isGoToPageEnabled(),"Go to page enabled - one row");

		// add 100 rows
		options.rows.removeAll();
		_.times(100,function(i){
			options.rows.push({ id : i , text : "control" + i.toString() });
		});
		ok(!viewModel.isPreviousEnabled(),"Previous disabled at first row - 100 rows");
		ok(viewModel.isNextEnabled(),"Next enabled at first row - 100 rows");
		ok(viewModel.isGoToPageEnabled(),"Go to page enabled at first row- 100 rows");

		// go to last page
		viewModel.pageIndex(viewModel.totalPages());

		ok(viewModel.isPreviousEnabled(),"Previous enabled at last row - 100 rows");
		ok(!viewModel.isNextEnabled(),"Next disabled at last row - 100 rows");
		ok(viewModel.isGoToPageEnabled(),"Go to page enabled at last row- 100 rows");

		viewModel.pageIndex(viewModel.totalPages()/2);
		ok(viewModel.isPreviousEnabled(),"Previous enabled in middle - 100 rows");
		ok(viewModel.isNextEnabled(),"Next enabled in middle - 100 rows");
		ok(viewModel.isGoToPageEnabled(),"Go to page enabled in middle- 100 rows");
	});
}());