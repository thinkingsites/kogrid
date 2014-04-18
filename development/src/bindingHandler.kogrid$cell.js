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
		
		extend(bindingAccessors,{
			style : bindThis(column.style),
			css : bindThis(column.css),
		});
		
	    // the extended binding context allows children to expose the parent's index.... maybe this isn't the best way
		var contextVars = makeContextVariables(bindingContext.$root,bindingContext.$parentContext.$index(),bindingContext.$index());

	    try
	    {
			applyBindingAccessorsToNode(element, bindingAccessors, bindingContext.extend(contextVars));
		} catch (e){
			// the above clause should not throw exceptions, however, it will during unit testing if we're not mocking out everything
			// rethrow the error, but add the result to the object so we an assert the result
			throw e._result = result,e;
		}
		
        return { 
        	controlsDescendantBindings : true
        };
    }
};