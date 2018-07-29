var geodist = require('geodist');
var moment = require('moment');
var fs = require('fs');

const functions = require('firebase-functions');

const admin = require('firebase-admin');

const gcs = require('@google-cloud/storage')()
admin.initializeApp(functions.config().firebase);


exports.clearPosts = functions.https.onRequest((req, res) =>{
console.log("delete posts more than 24hrs");
admin.database().ref('SamplePost').child('post').once('value').then(snapshot =>{
snapshot.forEach(function(child){
var postValue = child.val();
var convert = moment.unix(postValue.time);
var dateCheck = convert.startOf('hour').fromNow();
if (dateCheck == "1 day ago"){
	// this is where the deletion of the post would go 
	console.log(child.key,"would be deleted here")
	child.key.remove();
	functions.database.ref()
	admin.database.ref('SamplePost').child('post').child(child.key).remove();
 }
	else {
console.log(child.key," is not equal to this")
	
			}
		})
	})
});
exports.newUserMade = functions.auth.user().onCreate(event =>{
	const token = "exaBWet2Tng:APA91bFFWkFW9p3FXBF7tcCFFegz_reQE4-uQVx-qpN0nUT-VXD2MSi7NYpQE30Hdjjs6wmhdEHk5HOTFK4UHsPnlsMjvl6ZjKw2VBEYV7pF1Xor39o0FP0HcMApsUcUaKLH5UuVF7F_"
	const payload = {
			  notification: {
                title: "New user signed up",
                body: "",
                badge: "1",
                sound: "default"
            },
        };
	const options = {
		 priority: "high",
            timeToLive: 60 * 60 * 24
        };

return admin.messaging().sendToDevice(token, payload, options);

});
exports.increaseCredit = functions.https.onRequest((req, res) => {
console.log("reseting the values back to 5")
admin.database().ref('Users').once('value').then(snapshot => {
	snapshot.forEach(function(child){
			var creditValues = child.val();
			if (creditValues.postCredit < 5){
				
				admin.database().ref('Users').child(child.key).update({ postCredit: 5 });
				}
			}
		)
	})
})

exports.addNewNode = functions.https.onRequest((req,res) => {
	console.log('adding new node')
	admin.database().ref('Users').once('value').then(snapshot =>{
	snapshot.forEach(function(child){
		var currentValues = child.val();
	//after ".update" you put in the name of the new node and the new node value you want every User to have 

		admin.database().ref('Users').child(child.key).update({ testNode: "test" });
		})
	})
})


//THIS IS USED FOR THE PERMA FEED POSTS
//"97C56D95-DB85-464F-A158-CBF48CC55979" || snapshotValue.deviceID == "39D591DD-3CB7-4BBE-B0CF-4CF81C544195") 
	
		//the post is made by either me or ramona so it's fine
	
		//the post was not made by one of us so we would delete it here
		//below is how to delete it but I don't have the deviceID
		//console.log("this is the photo to be deleted " + snapshotValue.companyImage);
		//const filePath = snapshotValue.companyImage
		//const bucket = gcs.bucket('PermaPost_Images')
		//const file = bucket.file(filePath)
		//file.delete()
		//console.log("the photo should be deleted")
		//admin.database().ref('/PermaPost/post/{snapshot.key}').remove();
		


exports.postMade = functions.database.ref('/SamplePost/post/{pushId}').onWrite(event => {
	console.log('Someone made a post');
	var valueObject = event.data.val();
	
	return admin.database().ref('Users').once('value').then(snapshot => {
		const listOfUsers = {};
		snapshot.forEach(function(child){
			var values = child.val();
		
			userValue(values.userLat,values.userLong,values.radiusDistance,values.token,valueObject.lat,valueObject.long,valueObject.userUid,valueObject.text)
		})
	});
});

//the child.key works in getting the users uid now what we need to do is
// just take that child.key and writing it in the code below to not send a notification to that specfic user
//attach that in the postUser function below

function userValue(lat,long,radiusDistance,token,postLat,postLong,postUser,postText){
var userLocation = {lat: lat, lon: long}  
var postLocation = {lat: postLat, lon: postLong}

//var unconvertedDistance = geodist({lat: lat, lon: long}, {lat: postLat, lon: postLong});
//geolib.getDistance({latitude: lat, longitude: long}, {latitude: postLat, longitude: postLong});
//var convertedDistance = geolib.convertUnit('mi',unconvertedDistance, 0)
var convertedDistance = geodist(userLocation, postLocation, {exact: true, unit: 'mi'})

if (convertedDistance <= radiusDistance){
const payload = {
			  notification: {
                title: "Just posted! New sample near you!",
                body: postText,
                badge: "1",
                sound: "default"
            },
        };
	const options = {
		 priority: "high",
            timeToLive: 60 * 60 * 24
        };

return admin.messaging().sendToDevice(token, payload, options);
	};
};