var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var ClassRoom = require('../models/models').ClassRoom;
var ClassRoomUser = require('../models/models').ClassRoomUser;
var ClassRoomAssignment = require('../models/models').ClassRoomAssignment;
var Day = require('../models/models').Day;
var Assignment = require('../models/models').Assignment;
var Transaction = require('../models/models').Transaction;

router.get('/search', function(req, res, next){
	
	ClassRoom.find({$text : {$search: req.headers.search}}, {score: {'$meta': 'textScore'}}).sort({score: {'$meta': "textScore"}}).exec(function(err, results){

		console.log(results)

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
							var eC = parseInt(item[1]);
							var num = parseInt(item[1]) * day.wage;
							count+=eC;
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

router.post('/calculatePrice', function(req, res, next){

	ClassRoom.findById(mongoose.Types.ObjectId(req.body.classId)).lean().exec(function(error, classRoom){

		if(classRoom.owner + "" !== req.user.id + "") {
			res.json({'success': false, 'message': 'nice try buddy, but not today'});
		} else {
			
			Transaction.find({assignment: mongoose.Types.ObjectId(req.body.assignId)}).lean().exec(function(err, transactions) {

				var total = 0;

				console.log(transactions);

				transactions.forEach(function(item, index) {
					total+=item.spent;
				})

				console.log(total);


				Assignment.findById(mongoose.Types.ObjectId(req.body.assignId)).exec(function(error, assignment){

					var price = total/assignment.extraCredit;
					var weighted = price/assignment.weight;

					assignment.price = price;
					assignment.weightedPrice = weighted;
					assignment.active = false;

					ClassRoomAssignment.find({classRoom: mongoose.Types.ObjectId(req.body.classId)}).populate('assignment').sort('assignment.expireAt').lean().exec(function(error, classRoomAssignments){

						for(var i = 0; i < classRoomAssignments.length; i++){
							if(classRoomAssignments[i].assignment._id + "" === req.body.assignId) {
								console.log('assignment match found');

								if(i === 0) {
									assignment.inflation = 0;
									break;
								} else {
									weightedYesterday = classRoomAssignments[i-1].assignment.weightedPrice;
									console.log('weightedYesterday',weightedYesterday);
									assignment.inflation = ((weighted - weightedYesterday)/weightedYesterday) * 100;
									break;
								}
							}
						}


						Day.find({'assignment': assignment._id}).lean().exec(function(dayerror, days){
							dayerror ? console.log(error) : console.log(days)

							var sumTotalWage = 0;
							var sumExtraCredit = 0;
							var averageWage;

							days.forEach(function(item, index){
								sumTotalWage+=(item.extraCredit * item.wage);
								sumExtraCredit+=item.extraCredit;
							})

							averageWage = (sumTotalWage/sumExtraCredit);

							assignment.averageWage = averageWage;

								assignment.save(function(error, update){
									error ? console.log(error) : console.log(update)

									transactions.forEach(function(item, index){
										var extraCreditReceived = item.spent/price;
										var weightedCreditReceived = item.spent/weighted;
										Transaction.findByIdAndUpdate(item._id, {extraCreditReceived: extraCreditReceived, weightedCreditReceived: weightedCreditReceived}, {new: true}).exec(function(error, transaction){
										console.log('transaction updated')
										})
								})

								res.json({'success': true, 'message': 'assignment ended'});

						});

						})


					})
				})

			}) 


		}


	})
})


router.post('/findLatestDay', function(req, res, next){

		classId = mongoose.Types.ObjectId(req.body.classId);
		assignId = mongoose.Types.ObjectId(req.body.id);
		console.log(req.body, "req.body");

		ClassRoom.findById(classId).lean().exec(function(error, classRoom){

			if(classRoom.owner + "" !== req.user.id + ""){
				res.json({'success': false, 'message' : 'you do not own this class'});
			}

			else {
				Assignment.findById(assignId).lean().exec(function(error1, assign){
					console.log(assign.lastDay);
					res.json({'success': true, 'data' : assign.lastDay});

				})
			}


		})

})

router.post('/classRoom/:id', function(req, res, next){

	console.log(req.body, 'req.body');

	var wages = JSON.parse(req.body.wages);

	var lastDay = parseInt(wages[wages.length-1][0])+1;

	var assign = new Assignment({
		name: req.body.assignName,
		expireAt: req.body.assignDate,
		active: true,
		weight: req.body.assignWeight,
		lastDay: lastDay
	})

	assign.save(function(error, assign){
		error ? console.log(error) : null

		var classRoomAssign = new ClassRoomAssignment({
			classRoom: req.params.id,
			assignment: assign._id
		})

		classRoomAssign.save(function(error, cRA){
			error ? console.log(error) : null

			wages.forEach(function(item, index){
				var day = new Day({
					classRoom: req.params.id,
					assignment: assign._id,
					number: item[0],
					active: true,
					wage: item[1]
				})

				day.save(function(error, day){
					error ? console.log(error) : null
				})
			})
			res.send({'success': true, data: 'good'});
		})

	})

})

module.exports = router;