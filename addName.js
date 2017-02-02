var ClassRoom = require('./models/models').ClassRoom;

// ----------------------------------------------
// Import dependencies
// ----------------------------------------------
var mongoose = require('mongoose');

var connect = process.env.MONGODB_URI
mongoose.connect(connect);

// ----------------------------------------------
// Log successful connection in console
// ----------------------------------------------
var db = mongoose.connection;
db.once('open', function callback () {
  console.log("DB Connected!");
});

ClassRoom.find({}).populate('owner').exec(function(error, classrooms){
	error ? console.log(error) : console.log(classrooms)
	classrooms.forEach(function(item, index){
		ClassRoom.findByIdAndUpdate(item._id, {professor: item.owner.username}).exec(function(error, classroom){
			console.log('success');
		})
	})


})