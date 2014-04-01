var ViewModel = function(viewModel,element,classes){
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

			// resolve serverData to JS and clean it, we don't want to send any undefined, or null values since they turn into strings and often muck things up
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
                data: extend(paging, ajaxSorting, serverData),
                type: self.type || 'get',
                dataType: self.dataType || 'json',
            }).done(function (ajaxResult,textStatus,xhr) {

            	// get the rows and the total from the response
				var rows = self.getRows(ajaxResult,xhr);
                var total = self.getTotal(ajaxResult,xhr);

                // set observables
                self.rows(isFunction(self.map) ? map(rows,self.map) : rows);
                self.total(total || rows.length || 0);

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