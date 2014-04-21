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
    self.any = computed(function(){
        var r = unwrap(_rows);
        return !(_.isUndefined(r) || r.length == 0);
    });


    // display text for initial load
    self.none = computed(function(){
        var r = unwrap(_rows);
        return _.isUndefined(r) || r.length == 0;
    });
    self.noneText = observable(resolve(self.messages,'initial'));

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
};