var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var ClassRoom = require('../models/models').ClassRoom;
var ClassRoomUser = require('../models/models').ClassRoomUser;
var Day = require('../models/models').Day;
var Assignment = require('../models/models').Assignment;
var Transaction = require('../models/models').Transaction;

router.get('/search', function(req, res, next){
	
	ClassRoom.find({$text : {$search: req.headers.search}}).exec(function(err, results){

		err? console.log(err) : null

		res.json({'success': true, 'data': results});
	})
})

router.post('/addGronks', function(req, res, next){
	
	ClassRoom.findById(req.body.classId).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id + "") {
			console.log('no match and not logged in');
		} else {
			var data = JSON.parse(req.body.data);
			var classId = mongoose.Types.ObjectId(req.body.classId);
			
			Day.findById(mongoose.Types.ObjectId(req.body.dayId)).lean().exec(function(error, day){

				if(day && day.active) {
					console.log(req.body)
					console.log(classId);

					var asyncCall = new Promise(function(resolve, reject) {
						var count = 0;
						data.forEach(function(item, index){

							var num = parseInt(item[1]);
							count+=num;
							ClassRoomUser.findOneAndUpdate({user: mongoose.Types.ObjectId(item[0]), classRoom: classId}, {$inc:{gronks:num}}, {new: true}).exec(function(error, response){
									console.log(count)
									console.log(response);

								if(index === data.length-1) {
									resolve(count)
								}
							})
						})
					})

					asyncCall.then(function(count){

						Day.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.dayId), {$inc:{extraCredit:count}, active: false}, {new: true}).exec(function(error, day){

							console.log(day);
							Assignment.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.assignId), 
									{$inc: {extraCredit:count}}, {new: true}).exec(function(error, response){
										console.log(response);
										res.send({'success': true});
							})
					})	
				})
				} else {
					res.send({'success': false, 'message': 'day has already been closed'})
				}
			})
		}
	})
	
})


router.post('/transaction', function(req, res, next){
	ClassRoomUser.findOne({user: req.user.id, classRoom: mongoose.Types.ObjectId(req.body.classId)}).exec(function(error, classRoomUser){
			
		if(classRoomUser && classRoomUser.gronks > parseInt(req.body.amount)) {

			Transaction.findOne({user: req.user.id, assignment: mongoose.Types.ObjectId(req.body.assignId)}).lean().exec(function(er, transaction){

					if(!transaction) {

						var trans = new Transaction({
							user: req.user.id,
							assignment: req.body.assignId,
							classRoom: req.body.classId, 
							spent: parseInt(req.body.amount)
						})

						trans.save(function(error, trans){
							ClassRoomUser.findByIdAndUpdate(classRoomUser._id, {$inc: {gronks: -parseInt(req.body.amount)}}, {new: true}).exec(function(err, cRU) {

								console.log('update', cRU)
								res.json({'success': true, 'message' : 'transaction created', 'newBalance': cRU.gronks})
							})
						})
					} else {
						Transaction.findByIdAndUpdate(transaction._id, {$inc: {spent: parseInt(req.body.amount)}, updated: true}, {new: true}).exec(function(error, trans){

							console.log('transaction updated', trans);

							ClassRoomUser.findByIdAndUpdate(classRoomUser._id, {$inc: {gronks: -parseInt(req.body.amount)}}, {new: true}).exec(function(err, cRU) {

								console.log('update', cRU)
								res.json({'success': true, 'message' : 'transaction updated', 'newBalance': cRU.gronks})
							})
						})
					}
			})

		} else {
			res.json({'success': false, 'message': 'Insufficient Funds'})

		}

	})
})

module.exports = router;