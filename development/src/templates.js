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
    	template : "<div data-bind='visible : none,html: noneText'></div>",
    	cssClass: "ko-grid-no-rows"
	},
	checkbox: {
	    template: "<td style='text-align:center' data-bind='visible : $root.cb.visible'><input type='checkbox' data-bind='checked : $root.cb.checked($context), value: $root.cb.value($context), event : { click : $root.cb.change.bind($context) }'/></td>",
	    cssClass: "ko-grid-checkbox"
	}
};