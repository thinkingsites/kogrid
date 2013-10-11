"use strict";
// create private scope
(function(){
	var binding = function($, ko,_){
		// create global private variables
		var
	    ViewModel = function(viewModel,element,classes){
	    	var self = this;
	    	
	    	// for now, while dependant on jquery, use the jquery extend
	    	$.extend(self,defaultOptions,viewModel);
	    	self.element = element;
	    	self.templates = {};
	    	self.classes = classes;
	    	self.afterRender = _.debounce(function(){
	    		var 
	    			heads = $("." + self.classes.head,self.element),
	    			cells = $("." + self.classes.row + ":first ." + self.classes.cell,self.element),
	    			h,c;
	    			
	    		if(heads.length != cells.length){
	    			throw 'Head count does not match the cell count.';
	    		}
	    		
	    		heads.parents().first().height(heads.first().height());
	    		
	    		for(var i = 0; i < heads.length; i++){
	    			h = heads.eq(i);
	    			c = cells.eq(i);
	    			
	    			h.css({
	    				position: 'absolute',
	    				top:0,
	    				left: c.position().left,
	    				width : c.width(),
	    				float: "none",
	    				overflow:"hidden",
	    				"white-space" : "nowrap"
	    			});
	    		};
	    	},50);
	    	self.selectTemplate = function(column,rowData){
	    		var 
	    			templateName = self.templates[column.template],
	    			binding;
	    		if(templateName) {
		    		binding = {
		    			name : templateName,
		    			data : rowData
		    		};
			    } else {
		    		var 
		    			result,
		    			columnName = _.isString(column) ? column : column.key,
		    		  columnValue = rowData[columnName],
		    		  result = _.isFunction(columnValue) ? columnValue() : columnValue;
		    		binding = {
		    			name : cellTemplateId,
		    			data : result
		    		};
			    };
			    self.first = function(){};
			    self.previous = function(){};
			    self.next = function(){};
			    self.last = function(){};
			    self.refresh = function(){};
			    self.goToPage = function(){};
	    		return binding;
	    	};
	    	
	    	// find all observables in 
	    	(function sniff(val){
	    		_.forOwn(val,function(item,key){
	    			var toSniff = item;
	    			if(ko.isObservable(toSniff)){
	    				toSniff.subscribe(function(){
	    					self.afterRender();
	    				});
	    				toSniff = toSniff();
	    			}
	    			if(_.isObject(toSniff)){
		    			sniff(toSniff);
		    		}
	    		});
	    	}(viewModel));
	    },
	    cellTemplateId = 'ko-grid-default-cell-template',
			defaultOptions = {
		    data : undefined,
		    columns : undefined,
		    pageSize: 25,
		    pageIndex:1,
		    pager: true,
		    height: "auto"
	    },
	    templates = {
		    headContainer : "<div data-bind='foreach : { data : columns, afterRender : $root.afterRender }'></div>" ,
		    head : "<div data-bind='text : _.isString($data) ? $data : $data.title'></div>",
		    scrollContainer : "<div></div>",
		    table : "<table cellspacing='0' cellpadding='0'><tbody data-bind='foreach : { data : data, afterRender : $root.afterRender }'></tbody></table>",
		    row : "<tr data-bind='foreach : $root.columns'></tr>",
		    cell : "<td data-bind='template : $root.selectTemplate($data,$parent)'></td>",
		    pager : "<div></div>",
			  first : "<button>&lt;&lt; First</button>",
			  previous : "<button>&lt; Previous</button>",
			  next : "<button>Next &gt;</button>",
			  last : "<button>Last  &gt;&gt;</button>",
			  refresh  : "<button>Refresh</button>",
			  goToPage : "<div><input type='text'><button>Go</button></div>",
		    cellContentTemplate : "<script type='text/html' id='" + cellTemplateId + "'><!-- ko text: $data --><!-- /ko --></script>",
	    },
	    classNames = {
		    base : "ko-grid-",
		    main : "main",
		    row:"row",
		    table:"table",
		    container:"container",
		    scrollContainer:"scroll-container",
		    headContainer:"head-container",
		    head:"head",
		    refresh:"refresh",
		    first:"first", 
		    previous:"previous", 
		    next:"next", 
		    last:"last",
		    pager:"pager",
		    pageSelect:"page-select",
		    cell : "cell"
	    },
	    generateRandomId = function(){
	    	return classNames.base + Math.round(Math.random() * Math.pow(10,10)).toString();
	    };
		
	  ko.bindingHandlers.kogrid = {
	    init : function(element, valueAccessor){
	    	// first create header,
	    	// use jquery for ease of use for now until you can move away from it and use plain JS
	    	var 
	    		myClasses = _.clone(classNames),
	    		myClasses = _.omit(myClasses,"base"),
	    		myClasses = _.each(myClasses,function(item,key){
	    			myClasses[key] = classNames.base + item;
	    		}),
	    		elem = $(element).addClass(myClasses.main),
	    		headContainer = $(templates.headContainer).appendTo(elem).css({ position : 'relative' }).addClass(myClasses.headContainer),
	    		head = $(templates.head).appendTo(headContainer).addClass(myClasses.head),
	    		scrollContainer = $(templates.scrollContainer).appendTo(elem).addClass(myClasses.scrollContainer), 
	    		table = $(templates.table).appendTo(scrollContainer).addClass(myClasses.table),
	    		rows = $(templates.row).appendTo(table).addClass(myClasses.row),
	    		cells = $(templates.cell).appendTo(rows).addClass(myClasses.cell),
	    		pager = $(templates.pager).appendTo(elem).addClass(myClasses.pager),
	    		defaultTemplate = $(templates.cellContentTemplate).appendTo(element),
	    		// html is done now work on view model
	    		value = valueAccessor(),
	    		viewModel = new ViewModel(value,element,myClasses);
	    		
	    	// add dynamic templates
	    	_(viewModel.columns).filter(function(item){
	    		return _.isString(item.template);
	    	}).each(function(item){
	    		// if the element exists, leave
	    		if(_.isElement(document.getElementById(item.template))){
	    			return;
	    		} else {
	    			var id = generateRandomId();
	    			viewModel.templates[item.template] = id;
	    			$("<script type='text/html' id='" + id + "'>" + item.template + "</script>").appendTo(element);
	    		}
	    	});
	    		
	    	ko.applyBindingsToDescendants(viewModel,element);
	    		
	    	return { controlsDescendantBindings : true };
	    }, 
	    update : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
	    	// do data
	    },
		  options : defaultOptions,
		  templates : templates,
		  classNames : classNames
	  };
	};
	
	// apply to knockout if knockout exists
	if(typeof ko !== "undefined" && ko.observable) {
		binding(jQuery, ko,_);
	}
	
	if(typeof define !== "undefined" && define.amd) {
		define(['jquery','knockout', '_'], binding);
	};	
}());