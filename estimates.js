var handleCard = function(card) {
	console.log("new card " + $(card).data("issue-key"));

	// Jira: on-prem
	var spanWithEstimate = $(card).find(".ghx-corner span.aui-badge");
	if(!spanWithEstimate || spanWithEstimate.length == 0) {
		// Jira: cloud
		spanWithEstimate = $(card).find("aui-badge.ghx-estimate");
		if(!spanWithEstimate || spanWithEstimate.length == 0) {
			// Jira version 7.11.0 does not set the class
			spanWithEstimate = $(card).find("aui-badge");
			if(!spanWithEstimate || spanWithEstimate.length == 0) {
				// Jira version 7.11.0 KANBAN boards do not tell remaining days in a structured way
				// this is a good guess how to get it, but obviously not reliable
				var spanWithEstimate = $(card).find('[data-tooltip~="Remaining"]').children(".ghx-extra-field-content");
				if(!spanWithEstimate || spanWithEstimate.length == 0) {
					return NaN;
				}
			}
		}
	}

	var sumInHours = 0;
	var content = $(spanWithEstimate).html();
	if (content.length > 1) {
		console.log("card content: " + content);
		content.split(" ").forEach(function(item, index) {
			var timeUnit = item[item.length-1];
			var timeValue = parseFloat(item);
			console.log("found card value: " + timeValue + " with unit " + timeUnit);

			switch(timeUnit) {
				case "w": sumInHours += timeValue * 8 * 5;
				break;
				case "d": sumInHours += timeValue * 8;
				break;
				case "h": sumInHours += timeValue;
				break;
				default: console.log("Oops. Don't know how to handle time unit '" + timeUnit + "'. Please report me!");
			}
		});
		return sumInHours;
	}
};

var handleColumn = function(column, columnIdx, sumPerColumn) {
	console.log("new column, id=" + $(column).data("column-id"));

	var cards = $(column).find(".ghx-issue");
	var hasSumChangedForColumn = false;
	var sumForThisColumnn = 0;

	cards.each(function() {
		var cardValue = handleCard(this);
		if(typeof cardValue != "undefined" && !isNaN(cardValue)) {
			sumForThisColumnn += parseFloat(cardValue);
		}
	});
	console.log("SUM FOR COLUMN #" + columnIdx + " is: " + (parseFloat(sumForThisColumnn)/8) + " days");
	if(typeof sumPerColumn[columnIdx] == "undefined") {
		sumPerColumn[columnIdx] = 0;
	}
	if(typeof sumForThisColumnn != "undefined" && !isNaN(sumForThisColumnn)) {
		sumPerColumn[columnIdx] += sumForThisColumnn/8;
	}
};


 setInterval(function() {
	var sumPerColumn = [];

	var swimlanes = $("#ghx-pool .ghx-swimlane");
    swimlanes.each(function() {
    	console.log("new swimlane ");
		var columns = $(this).find(".ghx-columns .ghx-column");
		var columnIdx = 0;
		columns.each(function() {
			handleColumn(this, columnIdx, sumPerColumn);
			++columnIdx;
		});
    });

	var headers = $("#ghx-column-headers .ghx-column");
	columnIdx = 0;
	headers.each(function() {
		console.log("new header");
		var divQty = $(this).find(".sumcount");
		if(divQty.length == 0) {
			if(typeof sumPerColumn[columnIdx] != "undefined") {
				console.log("Setting header #" + columnIdx + " to: " + sumPerColumn[columnIdx]);
				$(this).append("<span class='sumcount label label-default'>" + (Math.round(sumPerColumn[columnIdx]*10)/10) + "d</span>");
			}
		}
		++columnIdx;
	});

}, 3000);