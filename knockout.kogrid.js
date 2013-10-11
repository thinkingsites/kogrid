"use strict";
// create private scope
(function(){
	var binding = function($, ko,_){
		// create global private variables
		var
	    ViewModel = function(viewModel,element,classes){
	    	var self = this,_totalRows;
	    	
	    	// for now, while dependant on jquery, use the jquery extend
	    	$.extend(self,defaultOptions,viewModel);
	    	self.element = element;
	    	self.templates = {};
	    	self.classes = classes;
		    self.pageSize = ko.isObservable(self.pageSize) ? self.pageSize : ko.observable(self.pageSize);
	    	self.pageIndex = ko.isObservable(self.pageIndex) ? self.pageIndex : ko.observable(self.pageIndex);
		    	
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
		    	
			    self.totalRows = ko.computed({
			    	read : function(){
							if(_.isNumber(_totalRows)){
								return _totalRows;
							} else {
								var data = ko.isObservable(self.data) ? self.data() : self.data;
								return data.length;
							}
			    	},
			    	write : function(newVal){
			    		_totalRows = newVal;
			    	}
			    });
			    self.currentPage = ko.computed(function(){
			    	var 
			    		rows = self.totalRows(),
				    	index = self.pageIndex();
			    	if(_.isNumber(rows) && _.isNumber(index)){
				    	return Math.ceil(index / rows);
				    } else {
				    	return NaN;
				    }
			    });
			    
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
	    baseCssClass = "ko-grid-",
			defaultOptions = {
		    data : undefined,
		    columns : undefined,
		    pageSize: 25,
		    pageSizeOptions : [10,25,50,100,200,'All'],
		    pageIndex:1,
		    pager: true,
		    height: "auto"
	    },
	    templates = {
		    headContainer : {
		    	template : "<div data-bind='foreach : { data : columns, afterRender : $root.afterRender }'></div>" ,
		    	cssClass : "head-container"
		    },
		    head : {
		    	template : "<div data-bind='text : _.isString($data) ? $data : $data.title'></div>",
		    	cssClass : "head"
		    },
		    scrollContainer : {
		    	template : "<div></div>",
		    	cssClass : "scroll-container"
		    },
		    table : {
		    	template : "<table cellspacing='0' cellpadding='0'><tbody data-bind='foreach : { data : data, afterRender : $root.afterRender }'></tbody></table>",
		    	cssClass : "table"
		    },
		    row : {
		    	template : "<tr data-bind='foreach : $root.columns'></tr>",
		    	cssClass : "row"
		    },
		    cell : {
		    	template : "<td data-bind='template : $root.selectTemplate($data,$parent)'></td>",
		    	cssClass : "cell"
		    },
		    pager : {
		    	template : "<div></div>",
		    	cssClass : "pager"
		    },
			  first : {
		    	template : "<button data-bind='click : first' title='First'>&lt;&lt; First</button>",
		    	cssClass : "first"
		    },
			  previous : {
		    	template : "<button data-bind='click : previous' title='Previous'>&lt; Previous</button>",
		    	cssClass : "previous"
		    },
			  next : {
		    	template : "<button data-bind='click : next' title='Next'>Next &gt;</button>",
		    	cssClass : "next"
		    },
			  last : {
		    	template : "<button data-bind='click : last' title='Last'>Last  &gt;&gt;</button>",
		    	cssClass : "last"
		    },
			  refresh  : {
		    	template : "<button data-bind='click : refresh' title='Refresh'>Refresh</button>",
		    	cssClass : "refresh"
		    },
		    pageSize : {
		    	template : "<select data-bind='options : pageSizeOptions, value : pageSize'></select>",
		    	cssClass : "page-size"
		    },
			  goToPage : {
		    	template : "<div><input type='text'><button>Go</button></div>",
		    	cssClass : "go-to-page"
		    },
			  pagingText :{
		    	template : "<div>Page <span data-bind='text:pageIndex'></span> of <span data-bind='text: currentPage'></span></div>",
		    	cssClass : "paging-text"
		    },
			  totalText :{
		    	template : "<div><span data-bind='text:totalRows'></span> records</div>",
		    	cssClass : "total-text"
		    },
		    cellContentTemplate : {
		    	template : "<script type='text/html' id='" + cellTemplateId + "'><!-- ko text: $data --><!-- /ko --></script>"
		    }
	    },
	    generateRandomId = function(){
	    	return baseCssClass + Math.round(Math.random() * Math.pow(10,10)).toString();
	    },
	    addElement = function(appendTo,key,css){
		    // use jquery for ease of use for now until you can move away from it and use plain JS
	    	var 
	    		nodeDescription = templates[key],
	    		result = $(nodeDescription.template).appendTo(appendTo);
	    		
	    	if(nodeDescription.cssClass){
		    	result.addClass(baseCssClass + nodeDescription.cssClass)
		    }
		    
		    if(css){
		    	result.css(css);
		    }
		    
		    return result;
	    };
		
	  ko.bindingHandlers.kogrid = {
	    init : function(element, valueAccessor){
	    	var 	    		
	    		// set up local settings
	    		myClasses = (function(){
	    			var result = {};
	    			_.each(templates,function(item,key){
		    			result[key] = baseCssClass + item.cssClass;
		    		});
		    		return result;
	    		}()),
	    		// create view model
	    		value = valueAccessor(),
	    		viewModel = new ViewModel(value,element,myClasses),
	    		
		    	// create html for header and body
	    		elem = $(element).addClass(myClasses.main),
	    		headContainer = addElement(elem,'headContainer',{ position : 'relative' }),
	    		head = addElement(headContainer,'head'),
	    		scrollContainer = addElement(elem,'scrollContainer'), 
	    		table = addElement(scrollContainer,'table'),
	    		rows = addElement(table,'row'),
	    		cells = addElement(rows,'cell'),
	    		defaultTemplate = addElement(elem,'cellContentTemplate'),
	    		pager,first,previous,next,last,refresh,goToPage;
	    		
	    	if(viewModel.pager){
	    		pager = addElement(elem,'pager');
	    		addElement(pager,'refresh');
	    		addElement(pager,'first');
	    		addElement(pager,'previous');
	    		addElement(pager,'pagingText');
	    		addElement(pager,'next');
	    		addElement(pager,'last');
	    		addElement(pager,'pageSize');
	    		addElement(pager,'goToPage');
	    		addElement(pager,'totalText');
	    	}
	    		
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
		  templates : templates
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