var
    cellTemplateId = 'ko-grid-default-cell-template',
    defaultOptions = {
	    pageSize: 25,
	    pageSizeOptions : [10,25,50,100,200,'All'],
	    pageIndex:1,
	    pager: true,
	    height: "auto",
	    autoLoad  : true,
	    async : true,
	    shrinkToFit : false,
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
    };