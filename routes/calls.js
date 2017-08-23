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
	console.log('userId', req.user.id);
	console.log('classId', req.body.classId);
	ClassRoomUser.findOne({user: req.user.id, classRoom: mongoose.Types.ObjectId(req.body.classId)}).exec(function(error, classRoomUser){
		console.log('classRoomUser', classRoomUser);
		console.log('gronks', classRoomUser.gronks);
		console.log('amount', req.body.amount)
		if(classRoomUser && classRoomUser.gronks >= parseInt(req.body.amount)) {

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
			
		Assignment.findById(mongoose.Types.ObjectId(req.body.assignId)).exec(function(error, assign) {

			if(assign.lastAssign){

				
			ClassRoomUser.find({'classRoom': mongoose.Types.ObjectId(req.body.classId)}).exec(function(error, classRoomUser){

				
				if (classRoomUser.length > 0) {

					var asyncCall3 = new Promise(function(resolve, reject){
						console.log('in promise')
						console.log(classRoomUser);
						classRoomUser.forEach(function(item1, index){
							console.log('in forEach')
							var t = new Transaction({
								'user': item1.user,
								'assignment': assign._id,
								'classRoom': item1.classRoom,
								'spent': item1.gronks
							})

							t.save(function(error, trans){
								console.log('transaction created', trans)

								ClassRoomUser.findOneAndUpdate({'user': item1.user, 'classRoom': item1.classRoom}, {'gronks': 0}, {new: true}).exec(function(error, ret){

									console.log('newClassRoomUser', ret);

									if(index === classRoomUser.length-1) {
										resolve('all transactions created')
									}


								})
							})
						})
					})

					asyncCall3.then(function(count){
							Transaction.find({'assignment': mongoose.Types.ObjectId(req.body.assignId)}).lean().exec(function(err, transactions) {

								if (transactions.length > 0) {
								var total = 0;
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

									ClassRoomAssignment.find({'classRoom': mongoose.Types.ObjectId(req.body.classId)}).populate('assignment').sort('assignment.expireAt').lean().exec(function(error, classRoomAssignments){

											console.log('in here');
											console.log('classroomassigns', classRoomAssignments);

											classRoomAssignments.sort(function(a,b){
												return new Date("" + b.assignment.expireAt) - new Date("" + a.assignment.expireAt)
											})

											classRoomAssignments.reverse();

										console.log('classroomassigns', classRoomAssignments);

										for(var i = 0; i < classRoomAssignments.length; i++){
											console.log('in for loop')
											if(classRoomAssignments[i].assignment._id + "" === req.body.assignId) {
												console.log('assignment match found');
												if(i === 0) {

													assignment.inflation = 0;
													break;
												} else {
													weightedYesterday = classRoomAssignments[i-1].assignment.weightedPrice;
													console.log('weightedYesterday',weightedYesterday);
													if (weightedYesterday === undefined){
														console.log('no weightedYesterday')
														assignment.inflation = 0;
														break;
													} else {
														assignment.inflation = ((weighted - weightedYesterday)/weightedYesterday) * 100;
														break;
													}
												}
											}
										}


										Day.find({'assignment': mongoose.Types.ObjectId(req.body.assignId)}).lean().exec(function(dayerror, days){
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

													var asyncCall1 = new Promise(function(resolve, reject){
														transactions.forEach(function(item, index){
															var extraCreditReceived = item.spent/price;
															var weightedCreditReceived = item.spent/weighted;
															Transaction.findByIdAndUpdate(item._id, {extraCreditReceived: extraCreditReceived, weightedCreditReceived: weightedCreditReceived}, {new: true}).exec(function(error, transaction){
																	console.log('transaction updated')
																	if(index === transactions.length-1){
																		resolve('done')
																	}
															})
														})


													})

													asyncCall1.then(function(done){
														console.log({'success': true, 'message': 'assignment ended'});

														
														res.json({'success': true, 'message': 'assignment ended'});
														

													})
												});

											})


										})
										})


									} else {
										console.log('in else statement')
										Assignment.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.assignId), {'active': false, 'inflation': 0, 'price': 0, 'weightedPrice': 0}).exec(function(error, assign){

											console.log({'success': true, 'message': 'assignment ended'});
												
											res.json({'success': true, 'message': 'assignment ended'});
														
										})
									}

						}) 




					})



				} else {
					console.log('no classRoom Users');
						Assignment.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.assignId), {'active': false, 'inflation': 0, 'price': 0, 'weightedPrice': 0}).exec(function(error, assign){

											console.log({'success': true, 'message': 'assignment ended'});
												
											res.json({'success': true, 'message': 'assignment ended'});
														
										})

				}

			})
			} else {
			Transaction.find({assignment: mongoose.Types.ObjectId(req.body.assignId)}).lean().exec(function(err, transactions) {

				if (transactions.length > 0) {
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
						console.log('in here');
						console.log('classroomassigns', classRoomAssignments);

						classRoomAssignments.sort(function(a,b){
							return new Date("" + b.assignment.expireAt) - new Date("" + a.assignment.expireAt)
						})

						classRoomAssignments.reverse();

						console.log('classroomassigns', classRoomAssignments);

						for(var i = 0; i < classRoomAssignments.length; i++){
							if(classRoomAssignments[i].assignment._id + "" === req.body.assignId) {
								console.log('assignment match found');
								console.log('i', i)
								if(i === 0) {
									console.log('in if')
									assignment.inflation = 0;
									break;
								} else {
									console.log('in else')
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

									var asyncCall1 = new Promise(function(resolve, reject){
											transactions.forEach(function(item, index){
												var extraCreditReceived = item.spent/price;
												var weightedCreditReceived = item.spent/weighted;
												Transaction.findByIdAndUpdate(item._id, {extraCreditReceived: extraCreditReceived, weightedCreditReceived: weightedCreditReceived}, {new: true}).exec(function(error, transaction){
														console.log('transaction updated')
															if(index === transactions.length-1){
																resolve('done')
															}
													})
											})


									})

									asyncCall1.then(function(done){
											console.log({'success': true, 'message': 'assignment ended'});

											
											res.json({'success': true, 'message': 'assignment ended'});
											

									})

						});

						})


					})
				})


			} else {
				console.log('in else statement')
				Assignment.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.assignId), {'active': false, 'inflation': 0, 'price': 0, 'weightedPrice': 0}).exec(function(error, assign){

					res.json({'success': true, 'message': 'assignment ended'});
				})
			}

			}) 


		}


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
	if (req.body.assignLast === "true") {
		var last = true;
	} else {
		var last = false;
	}


	var lastDay = parseInt(wages[wages.length-1][0])+1;
	console.log(lastDay);
	var assign = new Assignment({
		name: req.body.assignName,
		expireAt: req.body.assignDate,
		active: true,
		weight: req.body.assignWeight,
		lastDay: lastDay,
		lastAssign: last
	})

	assign.save(function(error, assign){
		error ? console.log(error) : null

	ClassRoomAssignment.find({'classRoom': req.params.id}).populate('assignment').exec(function(error, classRoomAssigns) {
		console.log(classRoomAssigns);
		var asyncCall = new Promise(function(resolve, reject) {
		if(classRoomAssigns.length > 0){
			classRoomAssigns.forEach(function(item, index){
				console.log('in loop');
				console.log(item.assignment.lastAssign);
				if(item.assignment.lastAssign && last) {
					Assignment.findByIdAndUpdate(item.assignment._id,{'lastAssign': false}).exec(function(error, classRoomAssign){
							if(index === classRoomAssigns.length-1) {
									resolve('done')
								}
					})
				} else {
					if(index === classRoomAssigns.length-1) {
						console.log('resolving');
							resolve('done')
					}
				}


			})
		} else {
			resolve('done');
		}
	})

			asyncCall.then(function(count){
				console.log('in resolve statement')
				var classRoomAssign1 = new ClassRoomAssignment({
					classRoom: req.params.id,
					assignment: assign._id
				})

				console.log('classRoomAssign1', classRoomAssign1)
				classRoomAssign1.save(function(error, cRA){
					error ? console.log(error) : console.log('CRA',cRA)
					console.log('in here 1.5');
					console.log('work')
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
				console.log('in here 2')
				res.send({'success': true, data: 'good'});
			})		
		})
	})

	})
})


router.post('/addExtraCreditAssign', function(req, res, next){
	console.log('body',req.body);
	classId = mongoose.Types.ObjectId(req.body.classId);
	assignId = mongoose.Types.ObjectId(req.body.assignId);
	amount = parseInt(req.body.amount);

	ClassRoom.findById(classId).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id+ ""){
			res.json({'success': false, "message": "Nice Try Fuck Face"});
		} else {
			Assignment.findByIdAndUpdate(assignId, {$inc: {extraCredit: amount}}, {new: true}).exec(function(error, assign){
				error ? console.log(error) : console.log(assign)

				res.json({'success': true, "message": "updated"})

			})
		}
	})

})

router.post('/addExtraGronks', function(req, res, next){
	console.log('body',req.body);
	classId = mongoose.Types.ObjectId(req.body.classId)

	ClassRoom.findById(classId).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id+""){
			res.json({'succes': false, 'message': 'Good try asshole'});
		} else {
			var data = JSON.parse(req.body.data);

			var asyncCall = new Promise(function(resolve, reject) {
						var count = 0;
						data.forEach(function(item, index){
							var eC = parseInt(item[1]);
							count+=eC;
							ClassRoomUser.findOneAndUpdate({user: mongoose.Types.ObjectId(item[0]), classRoom: classId}, {$inc:{gronks:eC}}, {new: true}).exec(function(error, response){
								if(index === data.length-1) {
									resolve(count)
								}
							})
						})
					})

				asyncCall.then(function(count){
					res.send({'success': true, 'message':'total gronks added' + count});
				})
		}
	})
})

router.post('/editAssign/:id', function(req, res, next){
	console.log('body', req.body);
	classId = mongoose.Types.ObjectId(req.body.classId);
	assignId = mongoose.Types.ObjectId(req.body.assignId);

	ClassRoom.findById(classId).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id+""){
			res.json({'success': false, "message": 'Not yo ClassRoom!!'})
		} else {

			if(req.body.assignLast === "true"){
				var last = true;
				console.log('last', last);
			} else {
				var last = false;
			}

			if (last) {

				if(req.body.dueDate){
					Assignment.findByIdAndUpdate(assignId, {'lastAssign': true, 'expireAt': new Date(req.body.dueDate)}, {new: true}).exec(function(error, assign) {
						ClassRoomAssignment.find({'classRoom': classId}).populate('assignment').exec(function(error, classRoomAssigns) {
							console.log('assign', assign)
							var asyncCall = new Promise(function(resolve, reject) {
								if(classRoomAssigns.length > 0){
									classRoomAssigns.forEach(function(item, index){
										if(item.assignment.lastAssign && item.assignment._id+"" !== assignId+"") {
											Assignment.findByIdAndUpdate(item.assignment._id,{'lastAssign': false}).exec(function(error, classRoomAssign){
												if(index === classRoomAssigns.length-1) {
													resolve('done')
												}
											})
										} else {
											if(index === classRoomAssigns.length-1) {
												console.log('resolving');
												resolve('done')
											}
										}
									})
								} else {
									resolve('done');
								}
							})

							asyncCall.then(function(count) {

								if(req.body.wageAmount) {
									var d = new Day({
										classRoom: classId,
										assignment: assign._id,
										number: assign.lastDay,
										active: true,
										wage: parseInt(req.body.wageAmount)
								})

									d.save(function(error, day){
										error ? console.log(error) : null
										Assignment.findByIdAndUpdate(assignId, {$inc: {lastDay: 1}}).exec(function(error, assign1){
											res.json({'success': true, "message": "Updated"})
										})
									});

								} else {
									res.json({'success': true, "message": "Updated"})
								}
						})
					})
				})
				} else {

					Assignment.findByIdAndUpdate(assignId, {lastAssign: true}, {new: true}).exec(function(error1, assign1) {
						if(error){
							console.log(error)
						}
						console.log('assign', assign1)
							ClassRoomAssignment.find({'classRoom': classId}).populate('assignment').exec(function(error, classRoomAssigns) {
							var asyncCall = new Promise(function(resolve, reject) {
								if(classRoomAssigns.length > 0){
									classRoomAssigns.forEach(function(item, index){
										if(item.assignment.lastAssign && last && item.assignment._id+"" !== assignId + "") {
											Assignment.findByIdAndUpdate(item.assignment._id,{'lastAssign': false}).exec(function(error, classRoomAssign){
												if(index === classRoomAssigns.length-1) {
													resolve('done')
												}
											})
										} else {
											if(index === classRoomAssigns.length-1) {
												console.log('resolving');
												resolve('done')
											}
										}
									})
								} else {
									resolve('done');
								}
							})

							asyncCall.then(function(count) {

								if(req.body.wageAmount) {
									var d = new Day({
										classRoom: classId,
										assignment: assign._id,
										number: assign.lastDay,
										active: true,
										wage: parseInt(req.body.wageAmount)
								})

								d.save(function(error, day){
									error ? console.log(error) : null
									Assignment.findByIdAndUpdate(assignId, {$inc: {lastDay: 1}}).exec(function(error, assign1){
										res.json({'success': true, "message": "Updated"})
									})
								});

								} else {
									res.json({'success': true, "message": assign1.lastAssign})
								}



						})
					})



					})
				}
			}
			else if(req.body.dueDate) {
				Assignment.findByIdAndUpdate(assignId, {expireAt: new Date(req.body.dueDate)}, {new: true}).exec(function(error, assign){
					console.log('update', assign)

					if(req.body.wageAmount) {
						var d = new Day({
							classRoom: classId,
							assignment: assign._id,
							number: assign.lastDay,
							active: true,
							wage: parseInt(req.body.wageAmount)
						})

						d.save(function(error, day){
							error ? console.log(error) : null
							Assignment.findByIdAndUpdate(assignId, {$inc: {lastDay: 1}}).exec(function(error, assign1){
								res.json({'success': true, "message": "Updated"})
							})
						});


					} else {
						res.json({'success': true, "message": "Updated"})
					}
				})
			} else if (req.body.wageAmount) {
					Assignment.findById(assignId).lean().exec(function(error, assign){
						var d = new Day({
							classRoom: classId,
							assignment: assign._id,
							number: assign.lastDay,
							active: true,
							wage: parseInt(req.body.wageAmount)
						})

						d.save(function(error, day){
							error ? console.log(error) : console.log(day)
							Assignment.findByIdAndUpdate(assignId, {$inc: {lastDay: 1}}).exec(function(error, assign1){
								res.json({'success': true, "message": "Updated"})
							})
						});
					})
			} else {
				res.json({'success': true, 'message': 'nothing to update'})
			}
		}

	})
})

module.exports = router;