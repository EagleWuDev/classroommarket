var ClassRoom = require('./models/models').ClassRoom;
var ClassRoomAssignment = require('./models/models').ClassRoomAssignment;
var Assignment = require('./models/models').Assignment;
var ClassRoomUser = require('./models/models').ClassRoomUser;
var Transaction = require('./models/models').Transaction;
var Day = require('./models/models').Day;
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

var currentDate = new Date();

Assignment.find({'expireAt': {$lt: currentDate}, 'active': true}).exec(function(error, assignments) {

	console.log(assignments);
	console.log('current date', currentDate);

  assignments.forEach(function(item, index){

	if(item.lastAssign) {
		console.log('assignment is last');
		ClassRoomAssignment.findOne({'assignment': item._id}).exec(function(error, classRoomAssignment){
			console.log(item)
			console.log(classRoomAssignment)
			ClassRoomUser.find({'classRoom': classRoomAssignment.classRoom}).exec(function(error, classRoomUser){
				console.log(item);
				if (classRoomUser.length > 0) {

					var asyncCall = new Promise(function(resolve, reject){
						classRoomUser.forEach(function(item1, index){
							var t = new Transaction({
								'user': item1.user,
								'assignment': item._id,
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

					asyncCall.then(function(count){
							Transaction.find({'assignment': item._id}).lean().exec(function(err, transactions) {

								if (transactions.length > 0) {
								var total = 0;
								transactions.forEach(function(item, index) {
									total+=item.spent;
								})

								console.log(total);


								Assignment.findById(item._id).exec(function(error, assignment){

									var price = total/assignment.extraCredit;
									var weighted = price/assignment.weight;

									assignment.price = price;
									assignment.weightedPrice = weighted;
									assignment.active = false;

								ClassRoomAssignment.find({'classRoom': classRoomAssignment.classRoom}).populate('assignment').sort('assignment.expireAt').lean().exec(function(error, classRoomAssignments){

										for(var i = 0; i < classRoomAssignments.length; i++){
											if(classRoomAssignments[i].assignment._id + "" === item._id) {
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


										Day.find({'assignment': item._id}).lean().exec(function(dayerror, days){
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

														if(index === assignments.length-1) {
															process.exit();
														}

													})
												});

											})


										})
										})


									} else {
										console.log('in else statement')
										Assignment.findByIdAndUpdate(item._id, {'active': false, 'inflation': 0, 'price': 0, 'weightedPrice': 0}).exec(function(error, assign){

											console.log({'success': true, 'message': 'assignment ended'});
													if(index === assignments.length-1) {
															process.exit();
														}
										})
									}

						}) 




					})



				} 

			})

		})

	} else {
		console.log('in else statement 1, not last assign')
		ClassRoomAssignment.findOne({'assignment': item._id}).exec(function(error, classRoomAssign){

			Transaction.find({'assignment': item._id}).lean().exec(function(err, transactions) {

				if (transactions.length > 0) {
				var total = 0;
				transactions.forEach(function(item, index) {
					total+=item.spent;
				})

				console.log(total);


				Assignment.findById(item._id).exec(function(error, assignment){

					var price = total/assignment.extraCredit;
					var weighted = price/assignment.weight;

					assignment.price = price;
					assignment.weightedPrice = weighted;
					assignment.active = false;

					ClassRoomAssignment.find({'classRoom': classRoomAssign.classRoom}).populate('assignment').sort('assignment.expireAt').lean().exec(function(error, classRoomAssignments){

						for(var i = 0; i < classRoomAssignments.length; i++){
							if(classRoomAssignments[i].assignment._id + "" === item._id) {
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


						Day.find({'assignment': item._id}).lean().exec(function(dayerror, days){
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

											if(index === assignments.length-1) {
												process.exit();
											}

									})

								});

						})


					})
				})


			} else {
				console.log('in else statement')
				Assignment.findByIdAndUpdate(item._id, {'active': false, 'inflation': 0, 'price': 0, 'weightedPrice': 0}).exec(function(error, assign){

					console.log({'success': true, 'message': 'assignment ended'});
							if(index === assignments.length-1) {
									process.exit();
								}
				})
			}

			}) 
		})
		}
	})
	

})