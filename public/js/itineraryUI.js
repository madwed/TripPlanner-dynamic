$(document).ready(function(){

//Categories of the itinerary
var itinCategories = ["hotel", "restaurant", "thing"];

//Maximum entries allowed in an itinerary day per category
var maxItinItems = {
	"hotel": 1,
	"restaurant": 2,
	"thing": 3
};

//Model
var currentDay = 0;
function newDay () {
	return {
		hotels: [],
		restaurants: [],
		things: []
	};
}
days = [newDay()];

//Adding click handlers for category selectors
//Adds items to a day's itinerary and that day's model-representation
itinCategories.forEach(function(category){
	var categoryId = "#" + category;
	var buttonId = categoryId + "-button";
	var categoryKey = category + "s";
	$(buttonId).click(function(){
		//Get the appropriate day-category array
		var dayItemModel = days[currentDay][categoryKey];
		//Find the selected option's value
		var itemName = $(buttonId).siblings("select").children(":selected").val();
		//Adds that value to the model
		var addedItem = all_itin_items[categoryKey].reduce(function(foundItem, nextItem){
			return nextItem.name === itemName ? nextItem : foundItem;
		}, null);
		var currentMarker = drawLocation(addedItem.place[0].location);
		dayItemModel.push({marker: currentMarker, name: itemName});
		//If the array is at the max length, replace the last item
		if($(categoryId).children().length === maxItinItems[category]){
			$(categoryId).children(":last-child").remove();
			dayItemModel[dayItemModel.length - 1].marker.setMap(null);
			dayItemModel.splice(-1,1);
		}
		addToCategory(itemName, category);
	});
});

//Add a click handler for the day button that starts on the page
dayClickHandler($(".day-buttons").children(":first-child"));

//click handler for add day button
$("#add-day-button").click(function(){
	//Only allow at most 7 days
	if(days.length < 7){
		//Add a new day to the model
		days.push(newDay());
		var dayNumber = days.length;
		//Add a button to the UI
		var $newButton = $('<button class="btn btn-circle day-btn">' + dayNumber + '</button>');
		$newButton.insertBefore("#add-day-button");

		dayClickHandler($newButton);
	}
});

//click handler for remove day button
$("#remove-day").click(function(){
	if(days.length > 1){
		//Remove the map markers if any when removing a day
		clearMap();
		//Remove the day from the model
		days.splice(currentDay, 1);
		$(".day-buttons").children().eq(currentDay).remove();
		for(var i = currentDay; i < days.length; i++){
			$(".day-buttons").children().eq(i).text(i + 1);
		}
		//If you removed the last day, decrement the current day
		if(currentDay === days.length){
			currentDay--;
		}
		//Update the itin
		$(".day-buttons").children().eq(currentDay).addClass("current-day");
		updateItinDay();
	}else if(days.length === 1){
		clearMap();
		days = [newDay()];
		updateItinDay();
	}
})

//takes a jquery selector
//adds a click handler to a day's button
function dayClickHandler ($selector){
	$selector.click(function(){
		$(".current-day").removeClass("current-day");
		$(this).addClass("current-day");
		clearMap();
		currentDay = $(this).index();
		updateItinDay();
	});
}

//For switching and deleting days
//Updates the itinerary with a new day from the model
function updateItinDay (){
	//Update the text of the current day
	$("#day-title").children(":first-child").text("Day " + (currentDay + 1));
	//Goes over all categories
	itinCategories.forEach(function(category){
		var categoryId = "#" + category;
		//Clears any existing itinerary items from the view
		$(categoryId).children().remove();
		//Adds any itinerary items from the model
		days[currentDay][category + "s"].forEach(function(item){
			addToCategory(item.name, category);
			item.marker.setMap(map);
		});
	});
}

//Add an item to an itinerary category
function addToCategory(itemName, category){
	//HTML for an item
	var itinHTML = '<div class="itinerary-item"><span class="title">' + itemName + '</span><button class="btn btn-xs btn-danger remove btn-circle">x</button></div>'
	var categoryId = "#" + category;
	var categoryKey = category + "s";
	//The array from the model for the category array of the current day
	var dayItemModel = days[currentDay][categoryKey];
	//Add the HTML under its category
	$(categoryId).append(itinHTML);
	//Add a click handler for the button of the category being added to the view
	$(categoryId).children(":last-child").children("button").click(function(event){
		var itemIndex = $(this).parent().index();
		dayItemModel[itemIndex].marker.setMap(null);
		dayItemModel.splice(itemIndex, 1);
		$(event.currentTarget).parent().remove();
	});
}


function drawLocation (location, opts) {
    if (typeof opts !== 'object') {
        opts = {}
    }
    opts.position = new google.maps.LatLng(location[0], location[1]);
    opts.map = map;
    var marker = new google.maps.Marker(opts);
    return marker;
}

function clearMap (){
	itinCategories.forEach(function(category){
		days[currentDay][category + "s"].forEach(function(item){
			item.marker.setMap(null);
		});
	});
}


});