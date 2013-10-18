"use strict";
// create private scope
(function(){
	var binding = function($, ko,_){
		// create global private variables
		var
			makeObservable = function(obs){
				return ko.isObservable(obs) ? obs : ko.observable(obs)
			},
			getObservable = function(obs){
				return ko.isObservable(obs) ? obs() : obs;
			},
			peekObservable = function(obs){
				return ko.isObservable(obs) ? obs.peek() : obs;
			},
			windowSize = ko.observable({
				h:  $(window).height(),
				w: $(window).width()
			}),
	    ViewModel = function(viewModel,element,classes){
	    	var 
		    	self = this,
		    	_totalRows,
		    	_ajax,
		    	_sorting = ko.observableArray(),
		    	_resizeHeaders = function(){    		
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
			    };
	    	
	    	// any time the window size changes, re-render the headers
	    	windowSize.subscribe(_resizeHeaders);
	    	
	    	// for now, while dependant on jquery, use the jquery extend
	    	$.extend(self,defaultOptions,viewModel);
	    	self.element = element;
	    	self.templates = {};
	    	self.classes = classes;
	    	self.rows = makeObservable(self.rows);
	    	self.total = makeObservable(self.total);
	    	self.pageSize = makeObservable(self.pageSize);
	    	self.pageIndex = makeObservable(self.pageIndex);
	
	    	self.afterRender = _.debounce(function(){
					_resizeHeaders();
	    		
	    		if(_.isFunction(self.renderComplete)){
	    			self.renderComplete(element)
	    		}
	    	},100);

				self.isColumnVisible = function($data){
					if(ko.isObservable($data.visible))
						return $data.visible();
					else if(_.isBoolean($data.visible))
						return $data.visible;
					else 
						return true;
				};
				
			self.sort = function (event) {

                // if the column is not sortable, leave immediately
			    if (this.sortable !== true)
			        return;

			    var
                    column = this,
                    appendSort =
                    // find the existing
                    _.find(_sorting.peek(), function (item, index) {
                        return item.key === column.key;
                    }) || {
                        // 
                        key: column.key,
                        direction: column.direction
                    },
                    sortingPlaceholder = _.filter(_sorting.peek(), function (item) {
			            return item.key != column.key;
			        });

			    if (appendSort.direction === sorting.asc) {
			        appendSort.direction = sorting.desc;
			    } else {
			        appendSort.direction = sorting.asc;
			    }

			    if (sorting.allowMultiSort) {
			        // this should set off the subscribed observables
			        sortingPlaceholder.unshift(appendSort);
			        _sorting(sortingPlaceholder);
			    } else {
			        _sorting([appendSort]);
			    }

			    if (ko.isObservable(column.direction)) {
			        column.direction(appendSort.direction);
			    } else {
			        column.direction = appendSort.direction;
			    }

			    if (_.isFunction(self.refresh)) {
			        self.refresh();
			    } else {
			        if (ko.isObservable(self.rows)) {
			            // sort the observable by the sorting
			        } else {
			            // sort the array by the sorting
			        }
			    }
			};

			self.sortClass = function (column) {
			    console.info("sorting class");
			    var mySort = _.find(_sorting(), function (item, index) {
			        return item.key === column.key;
			    });
			    if (mySort) {
			        if (mySort.direction == sorting.asc) {
			            return sorting.ascendingClass;
			        } else if (mySort.direction == sorting.desc) {
			            return sorting.descendingClass;
			        }
			    } 
			    return sorting.noSortClass;
			};
				
	    	self.selectCellTemplate = function(column,rowData){
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
	    	            data: _.extend({ },column.data,rowData)
	    	        };
	    	    } else {
	    	        var 
				    	result,
				    	columnName =_.isString(column) ? column : column.key,
			    		columnValue = rowData[columnName],
			    		result = _.isFunction(columnValue) ? columnValue() : columnValue,
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
			    		totalRows = self.total(),
              pageSize = self.pageSize();
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
					var page = parseInt(self.goToPageText.peek());
					if(_.isNumber(page) && page >= 1 && page <= self.totalPages.peek())
			    	self.pageIndex(page);
			    else 
			    	self.goToPageText("");
			};
    	self.goToPageText = ko.observable();
	    	
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
                    paging = _.isNumber(pageSize) ? { pageIndex: pageIndex, pageSize: pageSize } : { pageIndex: 1 },
                    serverData = peekObservable(self.data),
                    ajaxSorting = {};
	    	        ajaxSorting[sorting.sortColumn] = _.map(_sorting.peek(),function(item){
	    	            return item.key;
	    	        });
	    	        ajaxSorting[sorting.sortDirection] = _.map(_sorting.peek(), function (item) {
	    	            return item.direction;
	    	        });

                    // do ajax
	    	        return $.ajax({
	    	            url: self.url,
	    	            data: _.extend(paging, ajaxSorting, serverData),
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

	    	    if(ko.isObservable(self.data)){
                    self.data.subscribe(self.refresh);
                }
	    	    self.pageIndex.subscribe(self.refresh);
	    	    self.pageSize.subscribe(self.refresh);
	    	    self.refresh();
	    	}
	    },
	    cellTemplateId = 'ko-grid-default-cell-template',
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
		    	cssClass: "ko-grid-head-container"
		    },
		    head : {
		    	template : "<div data-bind='visible : $root.isColumnVisible($data), click : $root.sort, css : { \"ko-grid-is-sortable\" : $data.sortable } '><span data-bind='text : (_.isString($data) ? $data : $data.title)'></span></div>",
		    	cssClass: "ko-grid-head"
		    },
		    sortIcon : {
		        template: "<span type='button' data-bind='visible: $data.sortable,  css : $root.sortClass($data) '>Sort</span>",
		    	cssClass: 'ko-grid-sort-icon'
		    },
		    scrollContainer : {
		    	template : "<div></div>",
		    	cssClass: "ko-grid-scroll-container"
		    },
		    table : {
		    	template : "<table cellspacing='0' cellpadding='0'><tbody data-bind='foreach : { data : rows, afterRender : $root.afterRender }'></tbody></table>",
		    	cssClass: "ko-grid-table"
		    },
		    row : {
		    	template : "<tr data-bind='foreach : $root.columns, css : $index()%2 ? $root.classes.row + \"-even\" : $root.classes.row + \"-odd\" '></tr>",
		    	cssClass: "ko-grid-row"
		    },
		    cell : {
		    	template : "<td data-bind='template : $root.selectCellTemplate($data,$parent), visible : $root.isColumnVisible($data), style : $data.style, css : $data.css'></td>",
		    	cssClass: "ko-grid-cell"
		    },
		    pager : {
		    	template : "<div></div>",
		    	cssClass: "ko-grid-pager"
		    },
			  first : {
		    	template : "<button type='button' data-bind='click : first' title='First'>&lt;&lt; First</button>",
		    	cssClass: "ko-grid-first"
		    },
			  previous : {
		    	template : "<button type='button' data-bind='click : previous' title='Previous'>&lt; Previous</button>",
		    	cssClass: "ko-grid-previous"
		    },
			  next : {
		    	template : "<button type='button' data-bind='click : next' title='Next'>Next &gt;</button>",
		    	cssClass: "ko-grid-next"
		    },
			  last : {
		    	template : "<button type='button' data-bind='click : last' title='Last'>Last  &gt;&gt;</button>",
		    	cssClass: "ko-grid-last"
		    },
			  refresh  : {
		    	template : "<button type='button' data-bind='click : refresh' title='Refresh'>Refresh</button>",
		    	cssClass: "ko-grid-refresh"
		    },
		    pageSize : {
		    	template : "<select data-bind='options : pageSizeOptions, value : pageSize'></select>",
		    	cssClass: "ko-grid-page-size"
		    },
			goToPage : {
		    	template : "<div><input type='text' data-bind='value : goToPageText'><button data-bind='click : goToPage'>Go</button></div>",
		    	cssClass: "ko-grid-go-to-page"
		    },
			pagingText :{
		    	template : "<div>Page <span data-bind='text:pageIndex'></span> of <span data-bind='text: totalPages'></span></div>",
		    	cssClass: "ko-grid-paging-text"
		    },
			  totalText :{
		    	template : "<div><span data-bind='text:total'></span> records</div>",
		    	cssClass: "ko-grid-total-text"
		    },
		    cellContentTemplate : {
		    	template : "<script type='text/html' id='" + cellTemplateId + "'><!-- ko text: $data --><!-- /ko --></script>"
		    }
	    },
	    generateRandomId = function(){
	        return "ko-grid-" + Math.round(Math.random() * Math.pow(10,10)).toString();
	    },
	    addElement = function(appendTo,key,css){
		    // use jquery for ease of use for now until you can move away from it and use plain JS
	    	var 
	    		nodeDescription = templates[key],
	    		result = $(nodeDescription.template).appendTo(appendTo);
	    		
	    	if(nodeDescription.cssClass){
		    	result.addClass(nodeDescription.cssClass)
		    }
		    
		    if(css){
		    	result.css(css);
		    }
		    
		    return result;
	    },
	    sorting = {
            allowMultiSort : false,
            sortColumn : "sortColumn",
	        sortDirection : "sortDirection",
	        asc: "asc",
	        desc: "desc",
	        noSortClass: "ko-grid-sort-none",
	        ascendingClass : "ko-grid-sort-asc",
            descendingClass: "ko-grid-sort-desc"
	    };

			$(window).on("resize",_.debounce(function(){
				// there is a bug in IE8 that resizes the window any time the height of any cell changes its height or width dynamically
				// this statement is here to ensure that the resizing the header does not go into an infinite loop
				var newSize = { h	: $(window).height(), w : $(window).width() };
				var oldSize = windowSize.peek(); 
				if(newSize.h !== oldSize.h || newSize.w !== oldSize.w){
					windowSize(newSize);
				}
			},100));
		
	  ko.bindingHandlers.kogrid = {
	    init : function(element, valueAccessor){
	    	$(function(){
		    	var 	    		
		    		// set up local settings
		    		myClasses = (function(){
		    			var result = {};
		    			_.each(templates,function(item,key){
			    			result[key] = item.cssClass;
			    		});
			    		return result;
		    		}()),
		    		
		    		// create view model
		    		value = valueAccessor(),
		    		viewModel = new ViewModel(value,element,myClasses),
		    		columns = ko.isObservable(viewModel.columns) ? viewModel.columns.peek() : viewModel.columns,
		    		
			    	// create html for header and body
		    		elem = $(element).addClass(myClasses.main),
		    		headContainer = addElement(elem,'headContainer',{ position : 'relative' }),
		    		head = addElement(headContainer,'head'),
		    		sortIcon = addElement(head, 'sortIcon'),
		    		scrollContainer = addElement(elem,'scrollContainer'), 
		    		table = addElement(scrollContainer,'table',{ position : 'relative' }),
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
		    	_(columns).filter(function(item){
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
		    });
	    		
	    	return { controlsDescendantBindings : true };
	    }, 
	    update : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
	    	// do data
	    },
		options : defaultOptions,
		templates: templates,
		sorting: sorting
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