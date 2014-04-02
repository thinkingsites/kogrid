// make aliases for minification
var 
	throttle  = _.debounce,//ko.extenders.throttle,
	isObservable = ko.isObservable,
	observable=  ko.observable,
	observableArray = ko.observableArray,
	computed= ko.computed,
	extend=  _.extend,
	win=  window,
	each=  _.each,
	isFunction=  _.isFunction,
	isNumber=  _.isNumber,
	isString=  _.isString,
	map=  _.map,
	find=  _.find,
	bindingHandlers = ko.bindingHandlers,
    // allows for backward compatibility for KO 2.x
	applyBindingAccessorsToNode = ko.applyBindingAccessorsToNode || function (node, bindings,bindingContext) {

	    var clone = {};
	    _.each(bindings, function (item, key) {
	        // ko 2.x requires the items NOT be functions unline ko 3.0
            // resolve the bound functions and pass them to the node
	        clone[key] = item();
	    });

	    return ko.applyBindingsToNode(node, clone, bindingContext)
	},
	elementExists = function(toTest){
		return (_.isString(toTest) && document.getElementById(toTest)) || _.isElement(toTest)
	},
	noop=  function() {},
	bindThis=  function (toReturn) {
		return function () { 
			return this; 
		}.bind(toReturn);
	},				
	makeObservable=  function(obs){
		return isObservable(obs) ? obs : observable(obs);
	},
	getObservable = function(obs){
		return isObservable(obs) ? obs() : obs;
	},
	peekObservable=  function(obs){
		return isObservable(obs) ? obs.peek() : obs;
	},
	windowSize=  observable({
		h:  window.screen.height,	// $(win).height(),
		w: window.screen.width		// $(win).width()
	}),
	generateRandomId=  function(){
		return "ko-grid-" + Math.round(Math.random() * Math.pow(10,10)).toString();
	},
	addElement = function(appendTo,key,css){
		// use jquery for ease of use for now until you can move away from it and use plain JS
		var 
		    nodeDescription = templates[key],
		    result = $(nodeDescription.template).appendTo(appendTo);
		
		if(nodeDescription.cssClass){
		    result.addClass(nodeDescription.cssClass)
		}
		
		if(css){
		    result.css(css);
		}
		
		return result;
	},
	appendjQueryUISortingIcons=  function(options){
	  
	  // if the sorting icons have been set explicitly to false, leave
	  if(options.addjQueryUiSortingIcons === false) {
	    return;
	  }
	
	  var 
	    selectors = [
			"ui-icon",
			"ui-icon-triangle-2-n-s",
			"ui-icon-triangle-1-n",
			"ui-icon ui-icon-triangle-1-s"
	    ],
	    // if the sorting icons have been set explicitly to true, force the addition
	    forceAdd = options.addjQueryUiSortingIcons === true,
	    // sniff out whether jQuery UI exists
	    jQueryUiExists = (win.jQuery && win.jQuery.ui) || _.any(document.styleSheets,function(stylesheet){
	        return _(stylesheet.rules).filter(function (rule) {
	            return rule.selectorText;
	        }).map(function(rule){
				return rule.selectorText.slice(1);
			}).intersection(selectors).value().length == selectors.length;
	    });
	
		if(forceAdd || jQueryUiExists){
			options.sorting.noSortClass += [undefined,selectors[0],selectors[1]].join(" ");
			options.sorting.ascendingClass += [undefined,selectors[0],selectors[2]].join(" ");
			options.sorting.descendingClass += [undefined,selectors[0],selectors[3]].join(" ");
		}
	},
	sizeGridContainer=  function(element,height){
		var 
			elem = $(element),
			height = parseInt(height) || height,
			scrollContainer = $("." + templates.scrollContainer.cssClass,elem),
			headerHeight = $("." + templates.headContainer.cssClass,elem).outerHeight(),
			pagerHeight = $("." + templates.pager.cssClass,elem).outerHeight();
		
		elem.css("height",height);
		if(height !== "auto" && height !== "inherit"){
			scrollContainer.css("height",elem.innerHeight() - headerHeight - pagerHeight);
		} else {
			scrollContainer.css("height",height);
		}
	},
	recordIndex=  function(viewModel,index){
	    return ((viewModel.pageIndex.peek() - 1) * viewModel.pageSize.peek()) + index
	},
    makeContextVariables=  function (viewModel,column,index) {
        return {
            $columnValue: bindThis(column),
            $rowIndex: bindThis(index),
            $recordIndex: bindThis(recordIndex(viewModel,index))
        };
    };