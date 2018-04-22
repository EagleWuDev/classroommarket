var ClassRoomUser = require('./models/models').ClassRoomUser;
var Transaction = require('./models/models').Transaction;
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

// var t = new Transaction({
// 	'user': '59b0b540e5a29500115d95ff',
// 	'assignment' : '59bf158179e72700114fdf98',
// 	'classRoom' : '59bf148e79e72700114fdf89',
// 	'spent' : 5
// });

// t.save(function(error, trans){
	// Transaction.find({'assignment': '59bf158179e72700114fdf98'}).populate('assignment').exec(function(error, transCheck){

	// 	transCheck.forEach(function(item){
	// 		Transaction.findById(item._id).populate('assignment').exec(function(error, trans){
	// 			console.log(trans);
	// 		})
	// 	})
// })


// })


ClassRoomUser.find({'classRoom' : '59bf148e79e72700114fdf89'}).exec(function(error, classRoomUsers) {
	classRoomUsers.forEach(function(item, index){
		ClassRoomUser.findByIdAndUpdate(item._id, {'surveyActivate': true}, {new: true}).exec(function(error, classRoomUser){
			console.log(classRoomUser);
		})
	})
})

