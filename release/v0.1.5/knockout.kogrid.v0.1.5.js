/*
kogrid - created by Miguel Ludert
https://github.com/thinkingsites/kogrid

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
"use strict";
// create private scope
(function(){
	var binding = function($, ko,lodash){
		// create global private variables
		var
			// make aliases for minification
			throttle = _.debounce,//ko.extenders.throttle,
			isObservable = ko.isObservable,
			bindingHandlers = ko.bindingHanders,
			observable = ko.observable,
			observableArray = ko.observableArray,
			computed = ko.computed,
            // allows for backward compatibility for KO 2.x
			applyBindingAccessorsToNode = ko.applyBindingAccessorsToNode || function (node, bindings,bindingContext) {

			    var clone = {};
			    _.each(bindings, function (item, key) {
			        // ko 2.x requires the items NOT be functions unline ko 3.0
                    // resolve the bound functions and pass them to the node
			        clone[key] = item();
			    });

			    return ko.applyBindingsToNode(node, clone, bindingContext)
			},
			elementExists = function(toTest){
				return (_.isString(toTest) && document.getElementById(toTest)) || _.isElement(toTest)
			},
			extend = _.extend,
			win = window,
			each = _.each,
			isFunction = _.isFunction,
			isNumber = _.isNumber,
			isString = _.isString,
			map = _.map,
			find = _.find,
			noop = function() {},
			bindThis = function (toReturn) {
				return function () { 
					return this; 
				}.bind(toReturn);
			},				
			makeObservable = function(obs){
				return isObservable(obs) ? obs : observable(obs)
			},
			getObservable = function(obs){
				return isObservable(obs) ? obs() : obs;
			},
			peekObservable = function(obs){
				return isObservable(obs) ? obs.peek() : obs;
			},
			windowSize = observable({
				h:  $(win).height(),
				w: $(win).width()
			}),
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
			appendjQueryUISortingIcons = function(options){
			  
			  // if the sorting icons have been set explicitly to false, leave
			  if(options.addjQueryUiSortingIcons === false) {
			    return;
			  }
			
			  var 
			    selectors = [
					"ui-icon",
					"ui-icon-triangle-2-n-s",
					"ui-icon-triangle-1-n",
					"ui-icon ui-icon-triangle-1-s"
			    ],
			    // if the sorting icons have been set explicitly to true, force the addition
			    forceAdd = options.addjQueryUiSortingIcons === true,
			    // sniff out whether jQuery UI exists
			    jQueryUiExists = $.ui || _.any(document.styleSheets,function(stylesheet){
			        return _(stylesheet.rules).filter(function (rule) {
			            return rule.selectorText;
			        }).map(function(rule){
						return rule.selectorText.slice(1);
					}).intersection(selectors).value().length == selectors.length;
			    });
			
				if(forceAdd || jQueryUiExists){
					options.sorting.noSortClass += [undefined,selectors[0],selectors[1]].join(" ");
					options.sorting.ascendingClass += [undefined,selectors[0],selectors[2]].join(" ");
					options.sorting.descendingClass += [undefined,selectors[0],selectors[3]].join(" ");
				}
			},
			sizeGridContainer = function(element,height){
				var 
					elem = $(element),
					height = parseInt(height) || height,
					scrollContainer = $("." + templates.scrollContainer.cssClass,elem),
					headerHeight = $("." + templates.headContainer.cssClass,elem).outerHeight(),
					pagerHeight = $("." + templates.pager.cssClass,elem).outerHeight();
				
				elem.css("height",height);
				if(height !== "auto" && height !== "inherit"){
					scrollContainer.css("height",elem.innerHeight() - headerHeight - pagerHeight);
				} else {
					scrollContainer.css("height",height);
				}
			},
			recordIndex = function(viewModel,index){
			    return ((viewModel.pageIndex.peek() - 1) * viewModel.pageSize.peek()) + index
			},
            makeContextVariables = function (viewModel,column,index) {
                return {
                    $columnValue: bindThis(column),
                    $rowIndex: bindThis(index),
                    $recordIndex: bindThis(recordIndex(viewModel,index))
                };
            },
		    ViewModel = function(viewModel,element,classes){
		        var 
			    	self = this,
			    	_totalRows,
			    	_ajax,
			    	_sorting = observableArray(),
			    	_checkedRows = observableArray();
		    	
		        extend(self,defaultOptions,viewModel);
		        self.templates = {};
		        self.element = element;
		        self.classes = classes;
		        self.rows = makeObservable(self.rows);
		        self.height = makeObservable(self.height);
		        self.total = makeObservable(self.total);
		        self.pageSize = makeObservable(self.pageSize);
		        self.pageIndex = makeObservable(self.pageIndex);
		        self.url = makeObservable(self.url);
		        self.rowClick = function (data,event) {
		            var callback = this;
		            if (callback) {
		                return callback.call(data, data, event);
		            } else {
		                return true;
		            }
		        }.bind(self.rowClick);
		        self.isString = isString;
		        self.any = computed(function(){
		            var r = getObservable(self.rows);
		            return !(_.isUndefined(r) || r.length == 0);
		        });
		        self.none = computed(function(){
		            var r = getObservable(self.rows);
		            return _.isUndefined(r) || r.length == 0;
		        });
		        self.resizeHeaders = function(){ 
		            // try and find a way to do this without ajax   		
		            var 
						heads = $("." + self.classes.head,self.element),
						cells = $("." + self.classes.row + ":first ." + self.classes.cell,self.element).map(function(){
						    var $this = $(this);
						    // map these values for easier debugging
						    return {
						        left : $this.position().left,
						        width : $this.width()
						    };
						}),
			    		h,c;
			    	
		            // in order to resize, we want to make sure the number of headers matches the number of cells
		            if(heads.length != cells.length){
			    		
		                heads.css({
		                    position:"relative",
		                    top : 0,
		                    left : "auto",
		                    width : Math.floor(100 / heads.length) + "%"
		                }).width();
			    		
		                return;
		            }
	
		            // set the height of the head container to the height of the table headers	
		            heads.first().parent().height(heads.first().height());
			    		
		            for(var i = 0; i < heads.length; i++){
		                h = heads.eq(i);
		                c = cells[i];
			    			
		                h.css({
		                    position: 'absolute',
		                    top:0,
		                    // the minus one allows for the offset of collapsed table borders
		                    left: c.left -1,
		                    width : c.width
		                });
		            };					
		        };
				
		        self.afterRender = throttle(function(){
		            self.resizeHeaders();
		            sizeGridContainer(self.element,self.height.peek());
		            if(isFunction(self.done)){
		                self.done(element)
		            }
		        },10);
					
		        self.sort = function (event) {
	
		            // if the column is not sortable, leave immediately
		            if (this.sortable !== true)
		                return;
	
		            var
						column = this,
						appendSort = find(_sorting.peek(), function (item, index) {
						    return item.key === column.key;
						}) || {
						    key: column.key,
						    direction: column.direction
						},
							sortingPlaceholder = _.filter(_sorting.peek(), function (item) {
							    return item.key != column.key;
							});
	
		            if (appendSort.direction === self.sorting.asc) {
		                appendSort.direction = self.sorting.desc;
		            } else {
		                appendSort.direction = self.sorting.asc;
		            }
	
		            if (self.sorting.allowMultiSort) {
		                // this should set off the subscribed observables
		                sortingPlaceholder.unshift(appendSort);
		                _sorting(sortingPlaceholder);
		            } else {
		                _sorting([appendSort]);
		            }
	
		            if (isObservable(column.direction)) {
		                column.direction(appendSort.direction);
		            } else {
		                column.direction = appendSort.direction;
		            }
	
		            if (isFunction(self.refresh)) {
		                self.refresh();
		            } else {
		                if (isObservable(self.rows)) {
		                    // sort the observable by the sorting
		                } else {
		                    // sort the array by the sorting
		                }
		            }
		        };
	
		        self.sortClass = function (column) {
		            var mySort = find(_sorting(), function (item, index) {
		                return item.key === column.key;
		            });
		            if (mySort) {
		                if (mySort.direction == self.sorting.asc) {
		                    return self.sorting.ascendingClass;
		                } else if (mySort.direction == self.sorting.desc) {
		                    return self.sorting.descendingClass;
		                }
		            } 
		            return self.sorting.noSortClass;
		        };
			    
		        if (!isObservable(self.total)) {
		            self.total = computed({
		                read: function () {
		                    if (isNumber(_totalRows)) {
		                        return _totalRows;
		                    } else if (isObservable(self.rows)) {
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
	
		        self.totalPages = computed(function () {
		            var
						totalRows = self.total(),
						pageSize = self.pageSize();
		            if (isNumber(totalRows) && isNumber(pageSize)) {
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
		            if(isNumber(page) && page >= 1 && page <= self.totalPages.peek())
		                self.pageIndex(page);
		            else 
		                self.goToPageText("");
		        };
				
		        self.goToPageText = observable();

		        // any time the window size changes, re-render the headers
		        windowSize.subscribe(self.resizeHeaders);
		    
		        // find all observables in 
		        (function sniff(val){
		            _.forOwn(val,function(item,key){
		                var toSniff = item;
		                if(isObservable(toSniff)){
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
		        if (isString(self.url.peek())) {
		            // if the grid is an ajax grid, make rows a simple observable
		            self.rows = makeObservable(self.rows);
		            self.refresh = function () {
		                // if there is a loading function, fire it
		                if (isFunction(self.loading)) {
		                    // pass in the element and the old rows
		                    self.loading(self.element,self.rows.peek());
		                }
			
		                // calculate paging data and create ajax object
		                var 
			                pageIndex = self.pageIndex.peek(),
			                pageSize = self.pageSize.peek(),
			                paging = isNumber(pageSize) ? { pageIndex: pageIndex, pageSize: pageSize } : { pageIndex: 1 },
			                serverData = peekObservable(self.data),
			                ajaxSorting = {};
			                
		                ajaxSorting[self.sorting.sortColumn] = map(_sorting.peek(),function(item){
		                    return item.key;
		                });
			  	        
		                ajaxSorting[self.sorting.sortDirection] = map(_sorting.peek(), function (item) {
		                    return item.direction;
		                });
			
		                // do ajax
		                return $.ajax({
		                    url: self.url.peek(),
		                    data: extend(paging, ajaxSorting, serverData),
		                    type: self.type || 'get',
		                    dataType: self.dataType || 'json',
		                }).done(function (ajaxResult) {
		                    // set observables

                            
		                    self.rows(isFunction(self.map) ? map(ajaxResult.rows,self.map) : ajaxResult.rows);
		                    self.total(ajaxResult.total || ajaxResult.rows.length);
		                }).always(function () {
		                    // if there is a loaded function, fire it
		                    if (isFunction(self.loaded)) {
		                        // pass in the element and the new rows
		                        self.loaded(self.element,self.rows.peek());
		                    }
		                })
			            // return promise object
			            .promise(); 
		            };
			
		            if(isObservable(self.data)){
		                self.data.subscribe(self.refresh);
		            }
		          
		            self.url.subscribe(self.refresh);
		            self.refresh();
		        } else {
		            self.refresh = noop;
		    		
		            // if the grid is populated by a fixed array
		            var _rows = makeObservable(isFunction(self.map) ? map(getObservable(self.rows), self.map) : self.rows);
		            self.rows = computed({
		                read : function(){
		                    var 
			    				pageSize = self.pageSize(),
			    				start = (self.pageIndex()-1) * pageSize;
			    			
		                    return _rows().slice(start,start+pageSize);
		                },
		                write : function(val) {
		                    _rows(isFunction(self.map) ? map(getObservable(val), self.map) : val);
		                }
		            });
		    		
		            self.total(_rows.peek().length);
		        }
		    	
		        self.pageIndex.subscribe(self.refresh);
	    	    
		        self.pageSize.subscribe(function(){
		            var 
	    	    		totalPages = self.totalPages.peek(),
	    	    		pageIndex = self.pageIndex.peek();	    	    	
		            if(pageIndex > totalPages){
		                // if the page index is greater than the total pages, set the page index and let its subscription take care of refreshing the grid
		                self.pageIndex(totalPages);
		            } else {
		                self.refresh();
		            }
		        });
	    	
		        self.height.subscribe(function(newVal){
		            sizeGridContainer(self.element,newVal);
		        });
		    	
		        self.isColumnVisible = function(column){
		            column = column || this;		    		
		            if(isObservable(column.visible) || _.isBoolean(column.visible))
		                return column.visible;
		            else 
		                return true;
		        };

		        // encapsulate checkboxes in a single object
                
		        self.cb = {
		            visible : function () {
		                return !_.isEmpty(self.checkbox);
		            },
		            value : function (context) {
		                // 'this' is the binding context
		                var
                            index = context.$index(),
                            context = extend({}, context, makeContextVariables(self, -1, index));

		                return self.checkbox.id ? context.$data[self.checkbox.id] : context.$recordIndex;
		            },
		            change: function (data,event) {
		                var
                            result = true,
                            callback = self.checkbox.change,
                            index = this.$index(),
                            context = extend({}, this, makeContextVariables(self, -1, index));

		                // add or remove the record index from the checked rows
		                if($(event.target).is(":checked")) {
		                    _checkedRows.push({
		                        i : context.$recordIndex(),
                                v : context.$data//$(event.target).val()
		                    })
		                } else {
		                    _checkedRows.remove(function(item){
		                        return item.i == context.$recordIndex()
		                    });
		                }

		                // if the checkbox does not allow multiple by default remove all checks first
		                if (!self.checkbox.multiple) {
                            // get only the checked item
		                    var filtered = _.filter(_checkedRows.peek(), function (item) {
		                        return item.i == context.$recordIndex();
		                    });
                            // set the checked rows to only the checked item
		                    _checkedRows(filtered);
		                }

                        // if there is a callback, invoke it
		                if (isFunction(callback)) {
		                    result = callback.call(context.$data, context.$data, event, context);
		                }

		                // only block the callback if it explicitly returns false.
		                return result === false ? false : true;
		            },
		            checked: function (index) {
		                return _.find(_checkedRows(), function (item) {
		                    return item.i == recordIndex(self, index)
		                });
		            },
		            rows: _checkedRows
		    	};
				
				
				if(isObservable(self.checkedRows)){
					_checkedRows.subscribe(function(newval){
						var recordIndexes = _.sortBy(_checkedRows(),"i");
					    var result = map(recordIndexes, function (item) {
					        return item.v;
					    });
					    self.checkedRows(result);
					});
				}
		    },
		    cellTemplateId = 'ko-grid-default-cell-template',
		    defaultOptions = {
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
			    },
			    noRows: "No rows available",
                checkbox : false,
		        sorting : {
					allowMultiSort : false,
					sortColumn : "sortColumn",
					sortDirection : "sortDirection",
					asc: "asc",
					desc: "desc",
					noSortClass: "ko-grid-sort-none",
					ascendingClass : "ko-grid-sort-asc",
					descendingClass: "ko-grid-sort-desc",
					addjQueryUiSortingIcons : "auto"
		        }
		    },
		    templates = {
			    headContainer : {
			    	template : "<div></div>" ,
			    	cssClass: "ko-grid-head-container"
			    },
			    head : {
			        template: "<!-- ko foreach : { data : columns, afterRender : $root.afterRender } --><div data-bind='visible : $root.isColumnVisible($data), click : $root.sort, css : { \"ko-grid-is-sortable\" : $data.sortable } '><span data-bind='text : ($root.isString($data) ? $data : $data.title)'></span></div><!-- /ko -->",
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
			    	template : "<table cellspacing='0' cellpadding='0' data-bind='visible : any'><tbody data-bind='foreach : { data : rows, afterRender : $root.afterRender }'></tbody></table>",
			    	cssClass: "ko-grid-table"
			    },
			    row : {
			    	template : "<tr data-bind='click : $root.rowClick, css : $index()%2 ? $root.classes.row + \"-even\" : $root.classes.row + \"-odd\" '></tr>",
			    	cssClass: "ko-grid-row"
			    },
			    cell : {
			        template: "<!-- ko foreach : $root.columns --><td data-bind='kogrid$cell:$data'></td><!-- /ko -->",
			    	cssClass: "ko-grid-cell"
			    },
			    pager : {
			    	template : "<div></div>",
			    	cssClass: "ko-grid-pager"
			    },
				first : {
			    	template : "<button type='button' data-bind='click : first, disable : pageIndex() == 1' title='First'>&lt;&lt; First</button>",
			    	cssClass: "ko-grid-first"
			    },
				previous : {
			    	template : "<button type='button' data-bind='click : previous, disable : pageIndex() == 1' title='Previous'>&lt; Previous</button>",
			    	cssClass: "ko-grid-previous"
			    },
				next : {
			    	template : "<button type='button' data-bind='click : next, disable : pageIndex() == totalPages()' title='Next'>Next &gt;</button>",
			    	cssClass: "ko-grid-next"
			    },
				last : {
			    	template : "<button type='button' data-bind='click : last, disable : pageIndex() == totalPages()' title='Last'>Last  &gt;&gt;</button>",
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
				noRows :{
			    	template : "<div data-bind='visible : none,html: noRows'></div>",
			    	cssClass: "ko-grid-no-rows"
				},
				checkbox: {
				    template: "<td style='text-align:center' data-bind='visible : $root.cb.visible'><input type='checkbox' data-bind='checked : $root.cb.checked($index()), value: $root.cb.value($context), event : { click : $root.cb.change.bind($context) }'/></td>",
				    cssClass: "ko-grid-checkbox"
				}
		    };

	// because we can't control when the bindingHandler will be loaded, wrap the jQuery dom manipulations in $.ready
	$(function(){
    	$(win).on("resize",throttle(function(){
		    // there is a bug in IE8 that resizes the window any time the height of any cell changes its height or width dynamically
		    // this statement is here to ensure that the resizing the header does not go into an infinite loop
		    var 
		    	newSize = { h : $(win).height(), w : $(win).width() },
		    	oldSize = windowSize.peek(); 
		    if(newSize.h !== oldSize.h || newSize.w !== oldSize.w){
			    windowSize(newSize);
		    }
	    },100));
  	});
  	
	var bh = {
		kogrid$cell : {
			init : function(element, valueAccessor, allBindings, viewModel, bindingContext){
				var 
					root = bindingContext.$root,
					data = bindingContext.$parent,
					column = bindingContext.$data,
					templateName = root.templates[column.template],
					bindingAccessors = {
						visible : root.isColumnVisible.bind(column)
					};

				if(templateName){
					// if there is a template, bind it and display the template
					bindingAccessors.template = bindThis({
						name : templateName,
		    			// the column can contain extra and/or default row data
	            		// add the extra data to what's passed into the template
						data : extend({ },column.data,data)
					});
				} else {
					// if there is no template, display the row value
		    		var 
						result,
						columnName = isString(column) ? column : column.key,
						columnValue = data[columnName],
						result = isFunction(columnValue) ? columnValue() : columnValue;					
					
					bindingAccessors.text = bindThis(result);
				}
				
				extend(bindingAccessors,{
					style : bindThis(column.style),
					css : bindThis(column.css),
				});
				
			    // the extended binding context allows children to expose the parent's index.... maybe this isn't the best ay

				var contextVars = makeContextVariables(bindingContext.$root,bindingContext.$parentContext.$index(),bindingContext.$index());
				applyBindingAccessorsToNode(element, bindingAccessors, bindingContext.extend(contextVars));
				
		        return { controlsDescendantBindings: true };
			}
		},
		kogrid : {
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
			}
		};
		extend(ko.bindingHandlers,bh);
	};
	
	// apply to knockout if knockout exists
	if(typeof ko !== "undefined" && ko.observable) {
		binding(jQuery, ko,_);
	}
	
	if(typeof define !== "undefined" && define.amd) {
		define(['jquery','knockout', '_'], binding);
	};	
}());