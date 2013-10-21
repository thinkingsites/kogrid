kogrid
======

**kogrid** is intended to be a grid fully implemented in knockout with full support for observables.  As of this version only some of the variables support observables and are marked *observable* or *observableArray*.

Columns are ordered by likely frequency of use.

<h1>Documentation</h1>
* <h2>Options</h2> - These are the settings that are individually configurable on the grid.  The global option **defaultOptions** are also available to be set individually per grid as grid **Options**. 
    * **url** - *string, observable, conditionally required* - The url where the data will be summoned from.  If set to an observable the grid will refresh whenever the observable changes.  This is conditionally required; either this or the **data** property are required.</li>
    * <h3>columns</h3> - *array, observableArray, optional* - The column definitions.  If this is an observable, the rendered columns can be changed dynamically.
        * **title** - *string, observable, optional* -  The header text for the column.  If not provided the **key** will be used as the column header.
        * **template** - *string, observable, optional* - A string for the templateID to use or an html template.  If not defined the column will use a default text template.
        * **key** - *string, observable, optional* - The key for the data to be displayed.  If not provided it is assumed that there is a dynamic template for the column instead of displaying a single data element.
        * **css** - *object or string, observable, optional* - Binds to the cell's knockout css binding and follows all the same rules. [Knockout Css Binding](http://knockoutjs.com/documentation/css-binding.html)
        * **style** - *object, observable, optional* - Binds to the cell's knockout style binding and follows all the same rules. [Knockout Style Binding](http://knockoutjs.com/documentation/style-binding.html)
        * **visible** - *boolean, observable, optional* - Binds to the cell's knockout visible binding and follows all the same rules. [Knockout Visible Binding](http://knockoutjs.com/documentation/visible-binding.html)        
		* **data**- *object, observable, optional* - Extra data to pass into each grid cell, available as part of the **template** *$data*.  This object is merged with the row data and functions added to this object will have the row data bound to the *this* function keyword.
    * **rows** - *array of objects, observable, conditionally required* - If **url** is not used, the row data can be passed in directly through this variable.
    * **total** - *integer, observable, optional* If **url** is not used, the total number of rows can be passed in directly, otherwise will default to the current number of rows in **rows**.
    * **done** - *function, optional* - Will be fired after the grid has been rendered and any time the grid data is changed.
	* **utils** - *object, optional, special* - The **utils** option is populated by the kogrid binding after the data has been bound to the grid. It exposes methods to manipulate the grid after binding.  If an object is passed in, it will be merged with the grid's **utils** functions with the grid's functions taking precedence and have the grid's view model bound to the *this* parameter.
	    * **refresh** - *function* - Will refresh the data from the server.
		* **goToPage** - *function* - If passed in an integer the grid will automatically move to the requested page.
		* **fixHeaders**  - *function* - Will fix the headers to match the current size of the columns.  There are special circumstances where the headers move out of sync from the columns and this function can be used to correct that issue.
* <h2>Global Settings</h2> - These are settings that can be used to configure the behaviour of all grids within a site.  All settings extend from **ko.bindingHandlers.kogrid** for example **defaultOptions** will be set by altering **ko.bindingHandlers.kogrid.defaultOptions**. All *Global Options* are also available to be set individually per grid as grid **Options**.  The global options are not observable.
    * **defaultOptions** - *object, required*
		* **pageSize** - *integer, required* - The default number of rows to display.  Initially set to 25.
		* **pageSizeOptions** - *array, required* - The different page size options to display to the user.  Initially set to <code>\[10,25,50,100,200,'All'\]</code>
		* **pageIndex** - *integer, required* - The initial page to load. Initially set to <code>1</code>.
		* **pager** - *boolean, required* - Whether or not the pager should be displayed.  Initially set to <code>true</code>.
		* **height** - *string or integer, optional* - The default height of the grid. Initially set to <code>auto</code>. 
		* **loading** - *function, optional* - A function to fire before data is to be loaded onto the screen.  Initially set to dim the opacity of the table to 0\.5\.
		* **loaded** - *function, optional* - A function to fire after data has been rendered onto the screen.  Initially set to restore the opacity of the table to 1\.
		* **sorting** - *object, required*
			* **allowMultiSort** - *boolean,required* - Initally set to <code>false</code>
			* **sortColumn**  - *string, required* -  Initally set to <code>"sortColumn"</code>
			* **sortDirection**  - *string, required* -  Initally set to <code>"sortDirection"</code>
			* **asc** - *string* - Initally set to <code>"asc"</code>
			* **desc** - *string, required* - Initally set to <code>"desc"</code>
			* **noSortClass** - *string, required* - Initally set to <code>"ko-grid-sort-none"</code>
			* **ascendingClass** - *string, required* - Initally set to <code>"ko-grid-sort-asc"</code>
			* **descendingClass** - *string, required* -  Initally set to <code>"ko-grid-sort-desc"</code>
			* **addjQueryUiSortingIcons** - *boolean or string, required* - Whether or not to auto set the jquery sorting icons.  Possible values are <code>true</code>, <code>false</code>, <code>"auto"</code>.  If set to <code>"auto"</code>, jQuery UI will be auto-detected and the sorting icons added, otherwise the icons will be forced on or off. Initally set to <code>"auto"</code>
	* **templates** - *object, required* - Holds the list of templates for the jqgrid.  The templates are broken out into individual segments of the whole grid.  Each item in **templates** has a required **template** property and an optional **cssClass** described below.
		* **template** - The actual html template used to construct the grid.
		* **cssClass** - The class attribute placed on the top level node inside the **template**.
		* The templates defined are: 
			* headContainer
			* head
			* sortIcon
			* scrollContainer
			* table
			* row
			* cell
			* pager
			* first
			* previous
			* next
			* last
			* refresh
			* pageSize
			* goToPage
			* pagingText
			* totalText
			* cellContentTemplate