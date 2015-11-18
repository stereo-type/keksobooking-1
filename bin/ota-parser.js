var fs = require('fs');

var getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

var deg2rad = function(deg) {
  return deg * (Math.PI/180);
}

/** @const {{ lat: number, lng: number }} */
var CITY_CENTRE_COORDS = {
  lat: 35.41,
  lng: 139.36
};

/**
 * Map of OTA amenity names to keksobooking's.
 * @type {Object.<string, string>}
 */
var AmenitiesMap = {
  'has_breakfast': 'breakfast',
  'has_internet': 'wifi',
  'has_meal': 'breakfast',
  'has_parking': 'parking'
};

var rawData = fs.readFileSync(process.argv.slice(-1)[0], { 'encoding': 'utf8' });
var hotels = JSON.parse(rawData);
var outputHotels = [];

hotels['hotel_rates'].forEach(function(hotelData, i) {
  var currentHotel = hotelData.hotel;
  var outputHotel = {
    'amenities': [],
    'distance': parseFloat((getDistanceFromLatLonInKm(
        currentHotel['location'].lat,
        currentHotel['location'].lng,
        CITY_CENTRE_COORDS.lat,
        CITY_CENTRE_COORDS.lng) / 10).toFixed(1)),
    'location': currentHotel['location'],
    'name': currentHotel['name'],
    'pictures': [],
    'price': parseFloat(currentHotel['low_rate']),
    'rating': currentHotel['rating']['total'],
    'stars': Math.floor(currentHotel['star_rating'] / 10)
  };

  currentHotel['thumbnail_url_templates'].forEach(function(picTemplate, i) {
    if (i === 0) {
      outputHotel['preview'] = picTemplate.src.replace('{size}', '120x120');
    }

    outputHotel['pictures'].push(picTemplate.src.replace('{size}', 'x500'));
  });

  currentHotel['serp_filters'].forEach(function(amenity) {
    var currentAmenity = AmenitiesMap[amenity];
    if (currentAmenity && outputHotel.amenities.indexOf(currentAmenity) === -1) {
      outputHotel.amenities.push(currentAmenity);
    }
  });

  outputHotels.push(outputHotel);
});

console.log(JSON.stringify(outputHotels));
