kogrid
======

Requires KO 2.2.0 or higher

**kogrid** is intended to be a grid fully implemented in knockout with full support for observables.  Most of the **options** support observables and are marked *observable* or *observableArray* within this documentation.

Columns are ordered by likelihood of use.

<h1>Documentation</h1>
* <h2>Options</h2> - These are the settings that are individually configurable on the grid. 
    * **url** - *string, observable, conditionally required* - The url where the data will be summoned from.  If set to an observable the grid will refresh whenever the observable changes.  This is conditionally required; either this or the **data** property are required.</li>
    * **columns** - *array, observableArray, optional* - The column definitions.  If this is an observable, the rendered columns can be changed dynamically.
        * **title** - *string, observable, optional* -  The header text for the column.  If not provided the **key** will be used as the column header.
        * **template** - *string, observable, optional* - A string for the templateID to use or an html template.  If not defined the column will use a default text template.
        * **key** - *string, observable, optional* - The key for the data to be displayed.  If not provided it is assumed that there is a dynamic template for the column instead of displaying a single data element.
        * **css** - *object or string, observable, optional* - Binds to the cell's knockout css binding and follows all the same rules. <a href="http://knockoutjs.com/documentation/css-binding.html" target="_blank">Knockout Css Binding</a>
        * **style** - *object, observable, optional* - Binds to the cell's knockout style binding and follows all the same rules. <a href="http://knockoutjs.com/documentation/style-binding.html" target="_blank">Knockout Style Binding</a>
        * **visible** - *boolean, observable, optional* - Binds to the cell's and header's knockout <code>visible</code> binding and follows all the same rules. <a href="http://knockoutjs.com/documentation/visible-binding.html" target="_blank">Knockout Visible Binding</a> 
		* **data**- *object, observable, optional* - Extra data to pass into each grid cell, available as part of the **template** *$data*.  This object is merged with the row data and functions added to this object will have the row data bound to the *this* function keyword. 
    * **rows** - *array of objects, observable, conditionally required* - If **url** is not used, the row data can be passed in directly through this variable.
    * **total** - *integer, observable, optional* If **url** is not used, the total number of rows can be passed in directly, otherwise will default to the current number of rows in **rows**.
    * **done** - *function, optional* - Will be fired after the grid has been rendered and any time the grid data is changed.
    * **utils** - *object, optional, special* - The **utils** option is populated by the kogrid binding after the data has been bound to the grid. It exposes methods to manipulate the grid after binding.  If an object is passed in, it will be merged with the grid's **utils** functions with the grid's functions taking precedence and have the grid's view model bound to the *this* parameter.
		* **refresh** - *function* - Will refresh the data from the server if a url has been supplied, otherwise does nothing.
		* **goToPage** - *function* - If passed in an integer the grid will automatically move to the requested page.
		* **fixHeaders**  - *function* - Will fix the headers to match the current size of the columns.  There are special circumstances where the headers move out of sync from the columns and this function can be used to correct that issue.
    * **pageSize** - *integer, required, observable* - See **pageSize** in **Global Options**
    * **pageSizeOptions** - *array, required, observable* - See **pageSizeOptions** in **Global Options**
    * **pageIndex** - *integer, required, observable* - See **pageIndex** in **Global Options**
    * **pager** - *boolean, required* - See **pager** in **Global Options**
    * **height** - *string or integer, optional* - See **height** in **Global Options**
    * **loading** - *function, optional* - See **loading** in **Global Options**
    * **loaded** - *function, optional* - See **loaded** in **Global Options**
    * **noRows** - *html string, required, observable* - See **noRowsText** in **Global Options**
    * **dataType** - *string, optional* - See **loaded** in **Global Options**
		* **type** - *string, optional* - See **loaded** in **Global Options**
    * **sorting** - *object, required* - See **sorting** in **Global Options**
        * **allowMultiSort** - *boolean,required* - See **sorting.allowMultiSort** in **Global Options**
        * **sortColumn**  - *string, required* - See **sorting.sortColumn** in **Global Options**
        * **sortDirection**  - *string, required* - See **sorting.sortDirection** in **Global Options**
        * **asc** - *string* - See **sorting.asc** in **Global Options**
        * **desc** - *string, required* - See **sorting.desc** in **Global Options**
        * **noSortClass** - *string, required* - See **sorting.noSortClass** in **Global Options**
        * **ascendingClass** - *string, required* - See **sorting.ascendingClass** in **Global Options**
        * **descendingClass** - *string, required* - See **sorting.descendingClass** in **Global Options**
        * **addjQueryUiSortingIcons** - *boolean or string, required* - See **sorting.addjQueryUiSortingIcons** in **Global Options**
* <h2>Global Settings</h2> - These are settings that can be used to configure the behaviour of all grids within a site.
    * **ko.bindingHandlers.kogrid.options** - *object, required* - **options** provide default values for **Grid Options**
		* **pageSize** - *integer, required* - The default number of rows to display.  Initially set to <code>25</code>.
		* **pageSizeOptions** - *array, required* - The different page size options to display to the user.  Initially set to <code>\[10,25,50,100,200,'All'\]</code>
		* **pageIndex** - *integer, required* - The initial page to load. Initially set to <code>1</code>.
		* **pager** - *boolean, required* - Whether or not the pager should be displayed.  Initially set to <code>true</code>.
		* **height** - *string or integer, optional* - The default height of the grid. Initially set to <code>auto</code>. 
		* **loading** - *function, optional* - A function to fire before data is to be loaded onto the screen.  Initially set to dim the <code>opacity</code> of the table to <code>0\.5\</code>.
		* **loaded** - *function, optional* - A function to fire after data has been rendered onto the screen.  Initially set to restore the <code>opacity</code> of the table to <code>1\</code>.
		* **noRows** - *html string, required* - The html to display when there are no rows to display. This option does not accept knockout templating. Initially set to <code>"No rows available."</code>
		* **dataType** - *string, required* - The format to expect when receiving the data from the server. Initally set to <code>json</code>.
		* **type** -  *string, required* - The HTTP method to use when sending requests to the server. Initally set to <code>GET</code>.		
		* **sorting** - *object, required* - Contains sorting options.
			* **allowMultiSort** - *boolean,required* - Whether or not to send multiple sort commands to the database. Initally set to <code>false</code>
			* **sortColumn**  - *string, required* -  Customizes the name of the field sent to the server on an ajax request.  The name of the key Initally set to <code>"sortColumn"</code>
			* **sortDirection**  - *string, required* -  Customizes the name of the field sent to the server on an ajax request.  Initally set to <code>"sortDirection"</code>
			* **asc** - *string, required* - Customizes the name of the field sent to the server on an ajax request.  Initally set to <code>"asc"</code>
			* **desc** - *string, required* - Customizes the name of the field sent to the server on an ajax request.  Initally set to <code>"desc"</code>
			* **noSortClass** - *string, required* - The class given to a column when it is sortable and does not have sorting applied. Initally set to <code>"ko-grid-sort-none"</code>
			* **ascendingClass** - *string, required* - The class given to a column when it is sortable and is sorting in ascending order. Initally set to <code>"ko-grid-sort-asc"</code>
			* **descendingClass** - *string, required* -  The class given to a column when it is sortable and is sorting in descending order. Initally set to <code>"ko-grid-sort-desc"</code>
			* **addjQueryUiSortingIcons** - *boolean or string, required* - Whether or not to auto set the jquery sorting icons.  Possible values are <code>true</code>, <code>false</code>, <code>"auto"</code>.  If set to <code>"auto"</code>, jQuery UI will be auto-detected and the sorting icons added, otherwise the icons will be forced on or off. Initally set to <code>"auto"</code>
	* **ko.bindingHandlers.kogrid.templates** - *object, required* - Holds the list of templates for the jqgrid.  The templates are broken out into individual segments of the whole grid.  Each item in **templates** has a required **template** property and an optional **cssClass** described below.
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