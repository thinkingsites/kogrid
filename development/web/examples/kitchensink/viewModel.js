define(["knockout","mockjax.settings"], function (ko) {
    var viewmodel = {
        url: 'sampledata',
        columns: ko.observableArray([
						{
						    title: "ID",
						    template: "<input type='checkbox' data-bind='checked : isChecked()'/>",
						    data: {
						        isChecked: function () {
						            return Math.ceil(Math.random() * 10) > 5;
						        }
						    },
						    style: { width: "50px", "text-align": "center" },
						    css: "orange"
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
        renderComplete: function (element) {
            $(".ko-grid-pager button", element).css({ "background-color": "pink" });
        }
    };

    return viewmodel;
});