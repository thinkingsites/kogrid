bindingHandlers['kogrid$cell'] = {
	init : function(element, valueAccessor, allBindings, viewModel, bindingContext){
		var 
			root = bindingContext.$root,
			data = bindingContext.$parent,
			column = bindingContext.$data,
			templateName = root.templates[column.template],
			bindingAccessors = {
				visible : root.isColumnVisible.bind(column)
			};

		if(templateName){
			// if there is a template, bind it and display the template
			bindingAccessors.template = bindThis({
				name : templateName,
    			// the column can contain extra and/or default row data
        		// add the extra data to what's passed into the template
				data : extend({ },column.data,data)
			});
		} else {
			// if there is no template, display the row value
    		var 
				result,
				columnName = isString(column) ? column : column.key,
				columnValue = data[columnName],
				result = isFunction(columnValue) ? columnValue() : columnValue;					
			
			bindingAccessors.text = bindThis(result);
		}
		
		extend(bindingAccessors,{
			style : bindThis(column.style),
			css : bindThis(column.css),
		});
		
	    // the extended binding context allows children to expose the parent's index.... maybe this isn't the best ay

		var contextVars = makeContextVariables(bindingContext.$root,bindingContext.$parentContext.$index(),bindingContext.$index());
		applyBindingAccessorsToNode(element, bindingAccessors, bindingContext.extend(contextVars));
		
        return { controlsDescendantBindings: true };
	}
};