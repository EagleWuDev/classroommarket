var ClassRoomUser = require('./models/models').ClassRoomUser;
var Transaction = require('./models/models').Transaction;
var Day = require('./models/models').Day;
var Assign = require('./models/models').Assignment
var ClassRoomAssignment = require('./models/models').ClassRoomAssignment;
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

ClassRoomUser.find({'classRoom' : '59bf148e79e72700114fdf89'}).exec(function(error, classRoomUsers) {
	classRoomUsers.forEach(function(item, index){
		ClassRoomUser.findByIdAndUpdate(item._id, {'gronks': 0}, {new: true}).exec(function(error, classRoomUser){
			console.log(classRoomUser);
		})
	})
})

