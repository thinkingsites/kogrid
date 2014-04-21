/*globals require: false, exports: false, define: false, ko: false */

(function (factory) {
    // Module systems magic dance.

    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"),require("jquery"),require("lodash"), exports);
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout","jquery","lodash", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapping` property
        factory(ko,$,_, {});
    }
}(function ( ko, $, _, exports ) {

    if (typeof (ko) === undefined) { throw 'Knockout is required, please ensure it is loaded before loading this validation plug-in'; }
    if (typeof ($) === undefined) { throw 'jQuery is required, please ensure it is loaded before loading this validation plug-in'; }
    if (typeof (_) === undefined) { throw 'LoDash is required, please ensure it is loaded before loading this validation plug-in'; };

// make aliases for minification
var
	throttle  = _.debounce,//ko.extenders.throttle,
	isObservable = ko.isObservable,
	observable=  ko.observable,
	observableArray = ko.observableArray,
	computed= ko.computed,
	extend=  _.extend,
	win=  window,
	each=  _.each,
	isFunction=  _.isFunction,
	isNumber=  _.isNumber,
	isString=  _.isString,
	map=  _.map,
	find=  _.find,
	unwrap = ko.utils.unwrapObservable,
	bindingHandlers = ko.bindingHandlers,
	resolve = function(obj,key){
		var result = obj[key];
		if(_.isFunction(result)){
			result = result.apply(undefined,Array.prototype.slice.call(arguments,2));
		};
		return result;
	},
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
	noop=  function() {},
	bindThis=  function (toReturn) {
		return function () {
			return this.value;
		}.bind({ value : toReturn });
	},
	makeObservable=  function(obs){
		return isObservable(obs) ? obs : observable(obs);
	},
	peekObservable=  function(obs){
		return isObservable(obs) ? obs.peek() : obs;
	},
	windowSize=  observable({
		h:  win.screen.height,	// $(win).height(),
		w: win.screen.width		// $(win).width()
	}),
	generateRandomId=  function(){
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
	appendjQueryUISortingIcons=  function(options){

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
	    jQueryUiExists = (win.jQuery && win.jQuery.ui) || _.any(document.styleSheets,function(stylesheet){
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
	sizeGridContainer=  function(element,height){
	    var
			elem = $(element),
			height = parseInt(height) || height,
			shrinkToFit = height === "shrink",
			scrollContainer = $("." + templates.scrollContainer.cssClass, elem),
			headerHeight = $("." + templates.headContainer.cssClass, elem).outerHeight(),
			pagerHeight = $("." + templates.pager.cssClass, elem).outerHeight(),
			scrollHeight;

	    elem.toggleClass("ko-grid-shrink-to-fit", shrinkToFit);

	    scrollHeight = shrinkToFit ? "auto" :
            height !== "auto" && height !== "inherit" ? elem.innerHeight() - headerHeight - pagerHeight :
            height;

	    scrollContainer.css("height", scrollHeight);
	},
	recordIndex=  function(viewModel,index){
	    return ((viewModel.pageIndex.peek() - 1) * viewModel.pageSize.peek()) + index
	},
    makeContextVariables=  function (viewModel,column,index) {
        return {
            $columnValue: bindThis(column),
            $rowIndex: bindThis(index),
            $recordIndex: bindThis(recordIndex(viewModel,index))
        };
    };;

var ViewModel = function(viewModel,element,classes){

    // validate options as they come in
    if(!viewModel.url && !viewModel.rows) {
        throw "kogrid: Either 'url' or 'rows' must be defined in the grid options";
    }


    var
        // use the deep jquery extend for this call
    	self = $.extend(true,this,defaultOptions,viewModel),
    	_totalRows,
    	_ajax,
    	_sorting = observableArray(),
    	_checkedRows = observableArray()
        _rows = makeObservable(self.rows || []),
        _pageIndex = makeObservable(self.pageIndex);


    self.templates = {};
    self.element = element;
    self.classes = classes;
    self.height = makeObservable(self.height);
    self.total = makeObservable(self.total || 0);
    self.pageSize = makeObservable(self.pageSize);

    self.columns = ko.computed({
        read : function(){
            var result = this();
            if(self.sorting.sortableByDefault) {
                _.each(result,function(item){
                    item.sortable = item.sortable !== false ? true : false
                });
            }
            return result;
        },
        write : function  (newVal) {
            this(newVal);
        },
        owner : makeObservable(self.columns)
    });

    // the page index should not show any pages if there are no rows
    self.pageIndex = ko.computed({
        read : function () {
            var val = _pageIndex();
            if(_rows().length){
                return val;
            } else {
                return 0;
            }
        },
        write : function (newval){
            _pageIndex(newval);
        }
    });
    self.url = makeObservable(self.url);
    self.rowClick = function (data,event) {
        var callback = this;
        if (_.isFunction(callback)) {
            return callback.call(data, data, event);
        } else {
            return true;
        }
    }.bind(self.rowClick);
    self.isString = isString;
    self.any = computed(function () {
        return !!self.total();
    });


    self.none = computed(function () {
        return !self.total();
    });

    // display text for initial load
    self.noneText = observable(resolve(self.messages,'initial'));

    self.pagerVisible = ko.computed(function(){
        return !!unwrap(self.pager);
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

    // self.afterRender doesn't fire when unit testing the viewModel, only if the grid has been data bound to an element
    self.afterRender = throttle(function(){
        self.resizeHeaders();
        sizeGridContainer(self.element,self.height.peek());
        if(isFunction(self.done)){
            self.done(element,self.utils)
        }
    },10);

    self.sort = function (event) {

        // if the column is not sortable, leave immediately
        if (this.sortable !== true) {
            return;
        }

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
        }/* else {
            if (isObservable(self.rows)) {
                // sort the observable by the sorting
            } else {
                // sort the array by the sorting
            }
        }*/
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
                } else if (isObservable(_rows)) {
                    return _rows.peek().length;
                } else if (_.isArray(_rows)) {
                    return _rows.length;
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

        if (isNumber(totalRows) && isNumber(pageSize) && totalRows) {
            return Math.ceil(totalRows / pageSize);
        } else {
            return 0;
        }
    });

    self.first = function () {
        _pageIndex(1);
    };

    self.previous = function () {
        var newPage = _pageIndex.peek();
        _pageIndex(Math.max(1,newPage - 1));
    };

    self.next = function () {
        var
          newPage = _pageIndex.peek(),
	      maxPage = self.totalPages.peek();
        _pageIndex(Math.min(maxPage,newPage + 1));
    };

    self.last = function () {
        _pageIndex(self.totalPages.peek());
    };

    self.goToPage = function () {
        var page = parseInt(self.goToPageText.peek());
        if(isNumber(page) && page >= 1 && page <= self.totalPages.peek())
            _pageIndex(page);
        else
            self.goToPageText("");
    };

    // disabling functions for pagination
    self.isPreviousEnabled = function(){
        return _rows().length > 0 && 1 < _pageIndex();
    };

    self.isNextEnabled = function(){
        return _rows().length > 0 && _pageIndex() < self.totalPages();
    };

    self.isGoToPageEnabled = function(){
        return _rows().length > 0;
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
        // if the grid is an ajax grid, use existing rows as a simple observable
        self.rows = _rows;
        self.refresh = function () {

            // if there is a loading function, fire it
            if (isFunction(self.loading)) {
                // pass in the element and the old rows
                self.loading(self.element,self.rows.peek());
            }

            // once the method begins to load via ajax, tell the no rows message to change to the loading message
            self.noneText(resolve(self.messages,'loading'));

            // calculate paging data and create ajax object
            var
                pageIndex = _pageIndex.peek(),
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

            if(!self.sorting.allowMultiSort) {
                ajaxSorting[self.sorting.sortColumn]  = ajaxSorting[self.sorting.sortColumn][0];
                ajaxSorting[self.sorting.sortDirection]  = ajaxSorting[self.sorting.sortDirection][0];
            }

			// resolve serverData to JS and clean it
            // we don't want to send any undefined, or null values since they turn into strings and often muck things up
            // at the same time, we want to keep other falsy values
			serverData = ko.toJS(serverData);
			if(self.cleanPostData !== false) {
				_.each(serverData,function (item,key) {
					if(_.isUndefined(item) || _.isNull(item)) {
						serverData[key] = "";
					}
				});
			}

            // do ajax
            return $.ajax({
                url: self.url.peek(),
                data: extend(paging, ajaxSorting, self.sanitize(serverData)),
                type: self.type || 'get',
                dataType: self.dataType || 'json',
                async : self.async // allows for the grid to load synchronously if needed
            }).done(function (ajaxResult,textStatus,xhr) {

            	// get the rows and the total from the response
				var rows = self.getRows(ajaxResult,xhr);
                var total = self.getTotal(ajaxResult,xhr);

                // set observables
                self.rows(isFunction(self.map) ? map(rows,self.map) : rows);
                self.total(total || rows.length || 0);

                // now that the grid is off the initial state, change the no rows message
                self.noneText(self.noRows || resolve(self.messages,'noRows'));

            }).fail(function(xhr){
                self.noneText(resolve(self.messages,'error',xhr));
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

        // only auto load the grid if the autoLoad option is set to truthy
        if(self.autoLoad){
            self.refresh();
        }
    } else {
        self.refresh = noop;

        // if the grid is populated by a fixed array
        self.rows = computed({
            read : function(){
                var
                    result = _rows(),
    				pageSize = self.pageSize(),
    				start = (_pageIndex()-1) * pageSize;

                // if there is a map, use it
                if(isFunction(self.map)) {
                    result = map(result,self.map);
                }

                return result.slice(start,start+pageSize);
            },
            write : function(val) {
                _rows(val);
            }
        });

        self.total(_rows.peek().length);
        _rows.subscribe(function(){
            self.total(_rows.peek().length);
        });
    }

    self.clear = function () {
        self.rows([]);
        self.total(0);
        self.noneText(resolve(self.messages,'initial'));
    };

    _pageIndex.subscribe(self.refresh);

    self.pageSize.subscribe(function(){
        var
    		totalPages = self.totalPages.peek(),
    		pageIndex = _pageIndex.peek();
        if(pageIndex > totalPages){
            // if the page index is greater than the total pages, set the page index and let its subscription take care of refreshing the grid
            _pageIndex(totalPages);
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

            return self.id ? context.$data[self.id] : context.$recordIndex;
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
        checked: function (context) {
        	var callback;
        	if(self.id){
        		callback = function(item){
                	return item.v[self.id] == context.$data[self.id];
        		};
        	} else {
        		callback = function (item) {
                    return item.i == recordIndex(self, context.$index())
                };
        	}

            return _.find(_checkedRows(),callback);
        },
        rows: _checkedRows
	};

    // create the raw utils object for the grid
    this.utils = {
        fixHeaders: self.resizeHeaders,
        refresh: self.refresh,
        clear : self.clear,
        goToPage: function(pageIndex){
            _pageIndex(pageIndex);
        },
        // this should not be made a computed because it uses an argument
        getChecked: function (getIndexes) {
            var recordIndexes = _.sortBy(self.cb.rows(),"i");
            return map(recordIndexes, function (item) {
                return getIndexes ? item.i : item.v;
            });
        },
        //toggleCheck: function (recordIndex) { },
        checkedAll: function () {
            self.cb.rows(_.times(self.total()));
        },
        uncheckAll: function () {
            return self.cb.rows.removeAll();
        },
        element: function () {
            return element;
        }
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
};;

var
    cellTemplateId = 'ko-grid-default-cell-template',
    defaultOptions = {
	    pageSize: 25,
	    pageSizeOptions : [10,25,50,100,200,'All'],
	    pageIndex:1,
	    pager: true,
	    height: "auto", // will accept a number, a pixel count, and the values 'auto' and 'shrink'
	    autoLoad  : true,
	    async : true,
	    loading: function (element) {
	    	$("table", element).css({ opacity: 0.5 });
	    },
	    loaded: function (element) {
	    	$("table", element).css({ opacity: 1 });
	    },
	    messages : {
	    	initial : "",
	    	noRows : "No rows available",
	    	loading : "Loading..."
	    },
        checkbox : false,
        sorting : {
			allowMultiSort : false,
			sortColumn : "sortColumn",
			sortableByDefault : false,
			sortDirection : "sortDirection",
			asc: "asc",
			desc: "desc",
			noSortClass: "ko-grid-sort-none",
			ascendingClass : "ko-grid-sort-asc",
			descendingClass: "ko-grid-sort-desc",
			addjQueryUiSortingIcons : "auto"
        },
        getRows : function(result,xhr){
        	return result.rows;
        },
        getTotal : function(result,xhr) {
        	return result.total;
        },
        sanitize : function(data) {
        	return data;
        }
    };;

var templates = {
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
    	template : "<div data-bind='visible : pagerVisible'></div>",
    	cssClass: "ko-grid-pager"
    },
	first : {
    	template : "<button type='button' data-bind='click : first, enable : isPreviousEnabled' title='First'>&lt;&lt; First</button>",
    	cssClass: "ko-grid-first"
    },
	previous : {
    	template : "<button type='button' data-bind='click : previous, enable : isPreviousEnabled' title='Previous'>&lt; Previous</button>",
    	cssClass: "ko-grid-previous"
    },
	next : {
    	template : "<button type='button' data-bind='click : next, enable : isNextEnabled' title='Next'>Next &gt;</button>",
    	cssClass: "ko-grid-next"
    },
	last : {
    	template : "<button type='button' data-bind='click : last, enable : isNextEnabled' title='Last'>Last  &gt;&gt;</button>",
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
    	template : "<div><input type='text' data-bind='value : goToPageText, enable : isGoToPageEnabled'><button data-bind='click : goToPage, enable : isGoToPageEnabled'>Go</button></div>",
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
    	template : "<div data-bind='visible : none,html: noneText'></div>",
    	cssClass: "ko-grid-no-rows"
	},
	checkbox: {
	    template: "<td style='text-align:center' data-bind='visible : $root.cb.visible'><input type='checkbox' data-bind='checked : $root.cb.checked($context), value: $root.cb.value($context), event : { click : $root.cb.change.bind($context) }'/></td>",
	    cssClass: "ko-grid-checkbox"
	}
};;

bindingHandlers['kogrid$cell'] = {
	init : function(element, valueAccessor, allBindings, viewModel, bindingContext){
		var
			result,
			root = bindingContext.$root,
			data = bindingContext.$parent,
			column = bindingContext.$data,
			templateName = root.templates[column.template],
			bindingAccessors = {
				visible : root.isColumnVisible.bind(column)
			};

		if(templateName){
			// bind the data that gets sent to the template here, for unit testing
			result = extend({ },column.data,data);

			// if there is a template, bind it and display the template
			bindingAccessors.template = bindThis({
				name : templateName,
    			// the column can contain extra and/or default row data
        		// add the extra data to what's passed into the template
				data : result
			});
		} else {
			// if there is no template, display the row value
    		var
				columnName = isString(column) ? column : column.key,
				columnValue = data[columnName],
				result = isFunction(columnValue) ? columnValue() : columnValue;

			// if a format has been passed into the column, run it
			if(_.isFunction(column.format)){
				result = column.format(result);
			}

			bindingAccessors.text = bindThis(result);
		}

		// if there is a style or css binding on the column, apply them to bindingAccessors
		if(column.style){
			bindingAccessors['style'] = bindThis(column.style)
		}

		if(column.style){
			bindingAccessors['css'] = bindThis(column.css)
		}

	    // the extended binding context allows children to expose the parent's index.... maybe this isn't the best way
		var contextVars = makeContextVariables(bindingContext.$root,bindingContext.$parentContext.$index(),bindingContext.$index());

	    try
	    {
	    	var newBindingContext = bindingContext.extend(contextVars);
			applyBindingAccessorsToNode(element, bindingAccessors, newBindingContext);
		} catch (e){
			// the above clause should not throw exceptions, however, it will during unit testing if we're not mocking out everything
			// rethrow the error, but add the result to the object so we an assert the result
			throw e._result = result,e;
		}

        return {
        	controlsDescendantBindings : true
        };
    }
};;

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
	    		elem = $(element).addClass("ko-grid-main"),
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
};;

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
});;

}));