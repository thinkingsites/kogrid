define(["knockout","lodash"], function (ko,_) {
	
	// this is just dummy data in an array, the data we're displaying in this grid is all template based
    var rows = [
		{}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
		{}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
	];
	
    var viewmodel = {
        rows : rows,
        height: "300px",
        columns: ko.observableArray([
            { title: "Record", template: "Record : <!-- ko text : $recordIndex() --><!-- /ko -->" },
			{ title: "Column 1", template: "Row : <!-- ko text : $rowIndex() --><!-- /ko -->&nbsp;&nbsp; -- &nbsp;&nbsp; Col <!-- ko text : $columnIndex() --><!-- /ko -->" },
			{ title: "Column 2", template: "Row : <!-- ko text : $rowIndex() --><!-- /ko -->&nbsp;&nbsp; -- &nbsp;&nbsp; Col <!-- ko text : $columnIndex() --><!-- /ko -->" },
			{ title: "Column 3", template: "Row : <!-- ko text : $rowIndex() --><!-- /ko -->&nbsp;&nbsp; -- &nbsp;&nbsp; Col <!-- ko text : $columnIndex() --><!-- /ko -->" },
			{ title: "Column 4", template: "Row : <!-- ko text : $rowIndex() --><!-- /ko -->&nbsp;&nbsp; -- &nbsp;&nbsp; Col <!-- ko text : $columnIndex() --><!-- /ko -->" },
			{ title: "Column 5", template: "Row : <!-- ko text : $rowIndex() --><!-- /ko -->&nbsp;&nbsp; -- &nbsp;&nbsp; Col <!-- ko text : $columnIndex() --><!-- /ko -->" },
		])
    };

    return viewmodel;
});