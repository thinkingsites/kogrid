bindingHandlers['kogrid'] = {
	init : function(element, valueAccessor,allbindings,vm,bindingContext){
		$(function(){
	    	var 	    		
	    		// set up local settings
	    		myClasses = (function(){
	    			var result = {};
	    			each(templates,function(item,key){
		    			result[key] = item.cssClass;
		    		});
		    		return result;
	    		}()),
	    		
    		// create view model
    		value = valueAccessor(),
    		viewModel = new ViewModel(value,element,myClasses),
    		columns = isObservable(viewModel.columns) ? viewModel.columns.peek() : viewModel.columns,
    		
	    	// create html for header and body
    		elem = $(element).addClass("ko-grid-main").css({ height : viewModel.height.peek() }),
    		headContainer = addElement(elem,'headContainer',{ position : 'relative' }),
            headCheck = _.isEmpty(viewModel.checkbox) ? undefined : $("<div></div>").addClass(templates.head.cssClass).appendTo(headContainer),
    		head = addElement(headContainer,'head'),
    		sortIcon = addElement(head, 'sortIcon'),
    		scrollContainer = addElement(elem,'scrollContainer'),
    		table = addElement(scrollContainer,'table',{ position : 'relative' }),
    		rows = addElement(table, 'row'),
            checks = _.isEmpty(viewModel.checkbox) ? undefined : addElement(rows, 'checkbox').addClass(templates.cell.cssClass),
    		cells = addElement(rows,'cell'),
            norows = addElement(scrollContainer,'noRows'),
    		pager,first,previous,next,last,refresh,goToPage;
	    	
	    	if(viewModel.pager){
	    		pager = addElement(elem,'pager');
	    		if (viewModel.refresh !== noop) {
	    		    addElement(pager, 'refresh');
	    		}
	    		addElement(pager,'first');
	    		addElement(pager,'previous');
	    		addElement(pager,'pagingText');
	    		addElement(pager,'next');
	    		addElement(pager,'last');
	    		addElement(pager,'pageSize');
	    		addElement(pager,'goToPage');
	    		addElement(pager,'totalText');
	    	}
	    	
	    	var makeTemplate = function(templateName){
	    		// if the element exists, leave
	    		if(!elementExists(templateName))
	    		{
	    			var id = generateRandomId();
	    			viewModel.templates[templateName] = id;
	    			// these are grid specific templates, append them to the grid element instead of the body
	    			$("<script type='text/html' id='" + id + "'>" + getObservable(templateName) + "</script>").appendTo(element);
	    		} else if (_.isString(templateName)) {
	    		    // if the template does exist and it is a string, append it to the template names
	    		    viewModel.templates[templateName] = templateName;
	    		}
	    	};
	    	
	    	// add dynamic templates
	    	_(columns).filter(function(item){
	    		return isString(item.template);
	    	}).each(function(item){
	    		makeTemplate(item.template);
	    	});
	    	
	    	appendjQueryUISortingIcons(viewModel);

	    	ko.applyBindingsToDescendants(viewModel,element);
	
			// expose the grid utilities
			value.utils = extend({},value.utils,{
				fixHeaders: viewModel.resizeHeaders,
				refresh: viewModel.refresh,
				goToPage: function(pageIndex){
				    viewModel.pageIndex(pageIndex);
				},
				// this should not be made a computed because it uses an argument
				getChecked: function (getIndexes) {
				    var recordIndexes = _.sortBy(viewModel.cb.rows(),"i");
				    return map(recordIndexes, function (item) {
				        return getIndexes ? item.i : item.v;
				    });
				},
				//toggleCheck: function (recordIndex) { },
				checkedAll: function () {
				    viewModel.cb.rows(_.times(viewModel.total()));
				},
				uncheckAll: function () {
				    return viewModel.cb.rows.removeAll();
				},
				element: function () {
				    return element;
				}
			});
	    });
			
		return { controlsDescendantBindings : true };
	}, 
	options : defaultOptions,
	templates: templates
};