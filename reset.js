var ClassRoom = require('./models/models').ClassRoom;

var ClassRoomUser = require('./models/models').ClassRoomUser;

var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI
mongoose.connect(connect);
var Transactions = require('./models/models').Transaction;
var User = require('./models/models').User;
var db = mongoose.connection;
db.once('open', function callback () {
	console.log('DB Connected');
})

var currentDate =  new Date();

// ClassRoomUser.find({'classRoom': '59bf148e79e72700114fdf89'}).exec(function(error, classRoomUsers){


// 	classRoomUsers.forEach(function(item, index){
// 			ClassRoomUser.findByIdAndUpdate(item._id, {'gronks': 0}).exec(function(error, classRoomUser){
// 			console.log(classRoomUser);

// 		})
// 	})
// })

Transactions.find({'classRoom': '59bf148e79e72700114fdf89'}).populate('user assignment').exec(function(error, transactions){

	console.log(transactions);
	process.exit();
})

// User.findById('59a7031eb0e3230011a2d10b').exec(function(error, user){
// 	console.log(user);
// })
