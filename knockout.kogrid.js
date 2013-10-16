"use strict";
// create private scope
(function(){
	var binding = function($, ko,_){
		// create global private variables
		var
	    ViewModel = function(viewModel,element,classes){
	    	var self = this,_totalRows,_ajax;
	    	
	    	// for now, while dependant on jquery, use the jquery extend
	    	$.extend(self,defaultOptions,viewModel);
	    	self.element = element;
	    	self.templates = {};
	    	self.classes = classes;
	    	self.rows = ko.isObservable(self.rows) ? self.pageSize : ko.observable(self.rows);
	    	self.total = ko.isObservable(self.total) ? self.pageSize : ko.observable(self.total);
	    	self.pageSize = ko.isObservable(self.pageSize) ? self.pageSize : ko.observable(self.pageSize);
	    	self.pageIndex = ko.isObservable(self.pageIndex) ? self.pageIndex : ko.observable(self.pageIndex);

	    	self.afterRender = _.debounce(function(){
	    		var 
	    			heads = $("." + self.classes.head,self.element),
	    			cells = $("." + self.classes.row + ":first ." + self.classes.cell,self.element),
	    			h,c;
	    			
	    		if(heads.length != cells.length){
	    			return;
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
                    // if there is a template that already exists, check for it
	    			templateName = self.templates[column.template],
	    			binding;

                // if the template exists, load it
	    	    if(templateName) {
	    	        binding = {
	    	            name: templateName,
	    	            // the column can contain extra and/or default row data
                        // add the extra data to what's passed into the template
	    	            data: _.extend({},column.data,rowData)
	    	        };
	    	    } else {
	    	        var 
		    			result,
		    			columnName =
                            _.isString(column) ?
	    	                column :
                            column.key,
		    		    columnValue = rowData[columnName],
		    		    result =
                            _.isFunction(columnValue) ?
                            columnValue() :
                            columnValue;

	    	        binding = {
	    	            name : cellTemplateId,
	    	            data : result
	    	        };
	    	    }
	    		return binding;
	    	};
		    
	    	if (!ko.isObservable(self.total)) {
	    	    self.total = ko.computed({
	    	        read: function () {
	    	            if (_.isNumber(_totalRows)) {
	    	                return _totalRows;
	    	            } else if (ko.isObservable(self.rows)) {
	    	                return self.rows.peek().length;
	    	            } else if (_.isArray(self.rows)) {
	    	                return self.rows.length;
	    	            }
	    	        },
	    	        write: function (newVal) {
	    	            _totalRows = newVal;
	    	        }
	    	    });
	    	}

	    	self.totalPages = ko.computed(function () {
	    	    var
			    	totalRows = self.total.peek(),
                    pageSize = self.pageSize.peek();
	    	    if (_.isNumber(totalRows) && _.isNumber(pageSize)) {
	    	        return Math.ceil(totalRows / pageSize);
				} else {
				    return 1;
				}
			});

	    	self.first = function () {
	    	    self.pageIndex(1);
	    	};
	    	self.previous = function () {
	    	    var newPage = self.pageIndex.peek();
	    	    self.pageIndex(Math.max(1,newPage - 1));
	    	};
	    	self.next = function () {
	    	    var
                    newPage = self.pageIndex.peek(),
	    	        maxPage = self.totalPages.peek();
	    	    self.pageIndex(Math.min(maxPage,newPage + 1));
	    	};
			self.last = function () {
			    self.pageIndex(self.totalPages.peek());
			};
			self.goToPage = function () {
			    self.pageIndex(1);
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

            // now that we're set up, let's set up ajax only if we've been given a url
	    	if (_.isString(self.url)) {
	    	    self.refresh = function () {

                    // if there is a loading function, fire it
	    	        if (_.isFunction(self.loading)) {
                        // pass in the element and the old rows
	    	            self.loading(self.element,self.rows.peek());
	    	        }

                    // calculate paging data and create ajax object
	    	        var 
                        pageIndex = self.pageIndex.peek(),
                        pageSize = self.pageSize.peek(),
                        data =
                            _.isNumber(pageSize) ?
                            { pageIndex: pageIndex, pageSize: pageSize } :
                            { pageIndex: 1 };

                    // do ajax
	    	        return $.ajax({
	    	            url: self.url,
	    	            data: _.extend(data,self.data),
	    	            type: self.type || 'get',
	    	            dataType: self.dataType || 'json',
	    	        }).done(function (ajaxResult) {
                        // set observables
	    	            self.rows(ajaxResult.rows);
	    	            self.total(ajaxResult.total || ajaxResult.rows.length);
	    	        }).always(function () {

                        // if there is a loaded function, fire it
	    	            if (_.isFunction(self.loaded)) {
                            // pass in the element and the new rows
	    	                self.loaded(self.element,self.rows.peek());
	    	            }
	    	        })
                    // return promise object
                    .promise(); 
	    	    };

	    	    self.pageIndex.subscribe(self.refresh);
	    	    self.pageSize.subscribe(self.refresh);
	    	    self.refresh();
	    	}

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
		    height: "auto",
		    loading: function (element) {
		        $("table", element).css({ opacity: 0.5 });
		    },
		    loaded: function (element) {
		        $("table", element).css({ opacity: 1 });
		    }
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
		    	template : "<table cellspacing='0' cellpadding='0'><tbody data-bind='foreach : { data : rows, afterRender : $root.afterRender }'></tbody></table>",
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
		    	template : "<div>Page <span data-bind='text:pageIndex'></span> of <span data-bind='text: totalPages'></span></div>",
		    	cssClass : "paging-text"
		    },
			  totalText :{
		    	template : "<div><span data-bind='text:total'></span> records</div>",
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
	    		if (_.isFunction(viewModel.refresh) || viewModel.url) {
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