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

// var currentDate =  new Date();

// ClassRoomUser.find({'classRoom': '59bf148e79e72700114fdf89'}).exec(function(error, classRoomUsers){


// 	classRoomUsers.forEach(function(item, index){
// 			ClassRoomUser.findByIdAndUpdate(item._id, {'gronks': 0}).exec(function(error, classRoomUser){
// 			console.log(classRoomUser);

// 		})
// 	})
// })

Transactions.find({'assignment':'59bf15c579e72700114fdfa3'}).populate('user assignment').exec(function(error, transactions){

	// transactions.forEach(function(item){
	// 	Transactions.findByIdAndUpdate(item._id, {'extraCreditReceived':0, 'weightedCreditReceived': 0}).exec(function(error, transaction){
	// 		console.log(transaction)
	// 	})
	// })

	console.log(transactions)
	process.exit();

})
 
// //god damn it Jordan
// var t = new Transactions({
// 	user: '59bae96a6796b300115fa666',
// 	assignment: '59bf15c579e72700114fdfa3',
// 	classRoom: '59bf148e79e72700114fdf89',
// 	spent: 20
// });

// t.save(function(error, transaction){
// 	error ? console.log('error',error) : null

// 	console.log(transaction);
// })

// User.findById('59a7031eb0e3230011a2d10b').exec(function(error, user){
// 	console.log(user);
// })
