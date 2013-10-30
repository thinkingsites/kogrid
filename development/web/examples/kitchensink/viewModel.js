define(["knockout","mockjax.settings"], function (ko) {
    var viewmodel = {
        url: 'sampledata',
        height: "500px",
        // columns can be observable, and can be added or subtracted dynamically
        columns: ko.observableArray([
			{
				key : "checkbox",
			    template: "<input type='checkbox' data-bind='checked : isChecked()'/>",
			    // the data field allows us to expose data and functions to the template
			    data: {
			        isChecked: function () {
			            return Math.ceil(Math.random() * 10) > 5;
			        }
			    },
			    style: { width: "25px", "text-align": "center" },
			    css: "orange"
			},
        	{
        		title : "ID",
        		template : "<!-- ko text : $rowIndex()+1 --><!-- /ko -->",
			    style: { width: "40px", "text-align": "right" },
        	},
			{ title: "Name", key: "name", css: "hover" },
			{ title: "Occupation", key: "occupation" },
			{ title: "Address", key: "address" },
			{ title: "City", key: "city", sortable: true },
			{ title: "State", key: "state", sortable: true },
			{ title: "ZipCode", key: "zipcode", sortable: true },
			{ title: "Phone", key: "phone", visible: ko.observable(false) },
			{ title: "Status", key: "status", visible: ko.observable(false) },
			{ title: "Age", key: "age", style: { width: "50px", "text-align": "center" }, visible: ko.observable(false) }
		]),
        done: function (element) {
        	// the done event fires after the grid has been bound and is done rendering
            $(".ko-grid-pager button", element).css({ 
            	"background-color": "pink",
            	"border-radius" : "5px",
            	"border" : "solid 1px black"
            });
        }
    };
    return viewmodel;
});