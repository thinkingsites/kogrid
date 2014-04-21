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

	    		// get the height of the grid
	    		height = viewModel.height.peek(),
	    		shrinkToFit = height == "shrink",
	    		mainHeight = /auto|\d+px|%/.test(height) ?  height : "auto",

		    	// create html for header and body
	    		elem = $(element).addClass("ko-grid-main").css({ height : mainHeight }).toggleClass("ko-grid-shrink-to-fit",shrinkToFit),
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
	    			$("<script type='text/html' id='" + id + "'>" + unwrap(templateName) + "</script>").appendTo(element);
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

			// expose the grid utilities, merge them so we keep the original reference if there was a utils object passed in
			value.utils = extend(value.utils || {},viewModel.utils);

            // there is a bug with the headers where the headers don't display inside a jquery tab
            // resize on tab activation
            if (jQuery && jQuery.ui && jQuery.ui.tabs) {
                $(element).parents(".ui-tabs.ui-widget").on("tabsactivate", function () {
                    viewModel.utils.fixHeaders();
                });
            }
	    });

		return { controlsDescendantBindings : true };
	},
	options : defaultOptions,
	templates: templates
};