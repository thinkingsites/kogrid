// because we can't control when the bindingHandler will be loaded, wrap the jQuery dom manipulations in $.ready
$(function(){
	$(win).on("resize",throttle(function(){
	    // there is a bug in IE8 that resizes the window any time the height of any cell changes its height or width dynamically
	    // this statement is here to ensure that the resizing the header does not go into an infinite loop
	    var 
	    	newSize = { h : $(win).height(), w : $(win).width() },
	    	oldSize = windowSize.peek(); 
	    if(newSize.h !== oldSize.h || newSize.w !== oldSize.w){
		    windowSize(newSize);
	    }
    },100));
});