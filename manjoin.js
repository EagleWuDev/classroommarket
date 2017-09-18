var ClassRoomUser = require('./models/models').ClassRoomUser;

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

ClassRoomUser.find({'classRoom': '5914a085dbbbe40011399071'}).exec(function(error, classRoomUser){
	console.log(classRoomUser.length);
	ClassRoomUser.find({'classRoom': '59bf148e79e72700114fdf89'}).exec(function(error, classRoomUser1){
		console.log(classRoomUser1.length);
	})
})

