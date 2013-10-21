(function ($) {
    window.ajaxData = _.sortBy(window.ajaxData, 'name');

    $.mockjax(function (settings) {
        var index = settings.url.indexOf('?');
        var query = settings.url.slice(index + 1);
        var params = {};
        _.each(query.match(/\w+=\d+/g), function (item) {
            params[item.match(/\w+/).toString()] = parseInt(item.match(/\d+/));
        });
        var results = window.ajaxData;

        if (settings.data.sortColumn) {
            // no need to do complex sorting
            results = _.sortBy(results, settings.data.sortColumn[0]);
        }

        if (settings.data.sortDirection && settings.data.sortDirection[0] == 'desc') {
            results.reverse();
        }
        
        if (_.isNumber(settings.data.pageIndex) && _.isNumber(settings.data.pageSize)) {
            results = results.slice((settings.data.pageIndex - 1) * settings.data.pageSize, (settings.data.pageIndex) * settings.data.pageSize);
        }

        return {
            contentType: 'text/json',
            responseText: {
                total: window.ajaxData.length,
                rows : results
            }
        };
    });
}(jQuery));