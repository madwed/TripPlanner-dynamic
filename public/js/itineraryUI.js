$(document).ready(function(){

//Categories of the itinerary
var itinCategories = ["hotel", "restaurant", "thing"];

//Maximum entries allowed in an itinerary day per category
var maxItinItems = {
	"hotel": 1,
	"restaurant": 2,
	"thing": 3
};

var mapIcons = {
	"hotel": "/images/hotel.png",
	"restaurant": "/images/restaurant.png",
	"thing": "/images/thing_to_do.png"
}

//Model
var currentDay = 0;
function newDay () {
	return {
		hotels: [],
		restaurants: [],
		things: []
	};
}
var days = [newDay()];
var base = new google.maps.LatLngBounds(new google.maps.LatLng(40.689249,-74.0445), new google.maps.LatLng(40.838252, -73.856609));
map.fitBounds(base);
var extended = new google.maps.LatLngBounds();

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
		// Draw marker to map
		var currentMarker = drawLocation(addedItem.place[0].location, { icon: mapIcons[category] });
		// Apply new bounds to the map
		
		//If the array is at the max length, replace the last item
		if($(categoryId).children().length === maxItinItems[category]){
			//remove item from the itinerary
			$(categoryId).children(":last-child").remove();
			//remove the marker from the map
			dayItemModel[dayItemModel.length - 1].marker.setMap(null);
			//remove the item from the model
			dayItemModel.splice(-1,1);
		}
		dayItemModel.push({marker: currentMarker, name: itemName});
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
	var itinHTML = '<div class="itinerary-item"><span class="title">' + itemName + '</span><button class="btn btn-xs btn-danger remove btn-circle">x</button></div>';
	var categoryId = "#" + category;
	var categoryKey = category + "s";
	//The array from the model for the category array of the current day
	var dayItemModel = days[currentDay][categoryKey];
	//Add the HTML under its category
	$(categoryId).append(itinHTML);
	fitToBounds();
	//Add a click handler for the button of the category being added to the view
	$(categoryId).children(":last-child").children("button").click(function(event){
		var itemIndex = $(this).parent().index();
		var thisMarker = dayItemModel[itemIndex].marker;
		//Remove marker from map
		thisMarker.setMap(null);
		//Remove item from model
		dayItemModel.splice(itemIndex, 1);
		//Remove item from itin
		$(event.currentTarget).parent().remove();
		fitToBounds();	
	});
}


function drawLocation (location, opts) {
    if (typeof opts !== 'object') {
        opts = {};
    }
    opts.position = new google.maps.LatLng(location[0], location[1]);
    opts.map = map;
    var marker = new google.maps.Marker(opts);
    return marker;
}

function clearMap () {
	//Set the bounds to the default view
	map.fitBounds(base);
	//Remove all markers from the map
	itinCategories.forEach(function(category){
		days[currentDay][category + "s"].forEach(function(item){
			item.marker.setMap(null);
		});
	});
}

function fitToBounds () {
	var isThereAnythingOnMap = false;
	var today = days[currentDay];
	//Reset the bounds object
	extended = new google.maps.LatLngBounds();
	//Fit all the current itin items on the map
	Object.keys(today).forEach(function(category){
		today[category].forEach(function(item){
			var itemMarker = item.marker;
			itemMarker.setMap(map);
			extended.extend(itemMarker.position);
			isThereAnythingOnMap = true;
		});
	});
	if(isThereAnythingOnMap){
		map.fitBounds(extended);
		//Check how zoomed in the bounds are and set to a min zoom if it's too zoomed
		if(map.getZoom() > 17){
			map.setZoom(17);
		}
	}else{
		//If there is nothing on the map set the bounds to the default view
		map.fitBounds(base);
	}
}


});