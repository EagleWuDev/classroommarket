var express = require('express');
var router = express.Router();
var User = require('../models/models').User;
var ClassRoomUser = require('../models/models').ClassRoomUser;
var ClassRoom = require('../models/models').ClassRoom;
var Assignment = require('../models/models').Assignment;
var ClassRoomAssignment = require('../models/models').ClassRoomAssignment;
var Day = require('../models/models').Day;
var Transaction = require('../models/models').Transaction;
var Helpers = require('handlebars-helpers');
var helper = require('sendgrid').mail;
var groupBy = require('group-by');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/login');
});

/* USE YUUUUUGGGEEE WALLLLLLLLLLLL */
router.use(function(req, res, next){
    	if(!req.user){
    		res.redirect('/login');
    	} else {
    		User.findById(req.user.id, function(err, user){
    			if(!user.verified){
    				res.redirect('/verify')
    			} else {
    				return next();
    			}
    		})
  		}
  })

router.get('/home', function(req, res, next){
	User.findById(req.user.id, function(err, user){

		if (user.professor){
		ClassRoom.find({"owner": req.user.id}).sort('createdAt').exec(function(error, classRoom){
		
						res.render('homeprof', {
							name: user.lastName,
							activeNum: classRoom.length,
							classRoom: classRoom
						})
					})	
		} else {
			console.log(user)
			ClassRoomUser.find({user: req.user.id}).populate('classRoom').lean().exec(function(error, classRoomUser){

					console.log('classRoomUsers', classRoomUser)
					res.render('homestu', {
						firstName: user.firstName,
						lastName: user.lastName,
						classRoomUser: classRoomUser,
						activeNum: classRoomUser.length
					})



			})
		}
	})
})

router.post('/home', function(req, res, next){

	User.findById(req.user.id).lean().exec(function(error, user){

		var classRoom = new ClassRoom({
			name: req.body.className,
			college: req.body.collegeName,
			owner: req.user.id,
			professor: user.lastName,
			createdAt: new Date()
		})

		classRoom.save(function(error, classRoom){
			console.log('save');
			console.log(classRoom);
			res.redirect('/classRoom/' + classRoom._id);
		})

	})
})
router.get('/transactions/:id', function(req, res, next){
	ClassRoom.findById(req.params.id).exec(function(error, classRoom){

	if(classRoom.owner + "" === req.user.id + "") {

	
	Transaction.find({'classRoom' : req.params.id}).populate('user assignment').lean().exec(function(error, trans){
		var grouped = groupBy(trans, function(tran){
			return tran.assignment._id
		});
		var groupedName = groupBy(trans, function(tran){
			return tran.user._id
		})
		
		var arr = [];
		var arrName = [];
		for (key in grouped){
			arr.push({'name':grouped[key][0].assignment.name,'id':grouped[key][0]._id,'contents': grouped[key]});
		}
		for (key in groupedName) {
			arrName.push({'lastName': groupedName[key][0].user.lastName,'firstName': groupedName[key][0].user.firstName, 'id':groupedName[key][0]._id, 'contents':groupedName[key]});
		}
		
		arrName.forEach(function(item){
			
			item.contents.sort(function(a,b){
				return a.assignment.expireAt - b.assignment.expireAt
			})
		})

		arrName.sort(function(a,b){
			 if(a.lastName < b.lastName) return -1;
   			 if(a.lastName > b.lastName) return 1;
   				 return 0;
		})

		console.log("arrName After", arrName)
		arr.sort(function(a,b){
			return a.contents[0].assignment.expireAt - b.contents[0].assignment.expireAt
		});
		

		res.render('transactionsprof', {
			transactions: arr,
			students: arrName,
			classRoomId: req.params.id,
			classRoom: classRoom
		});

	})
} else {
	Transaction.find({'classRoom': req.params.id, 'user': req.user.id}).populate('assignment').lean().exec(function(error, transactions){
		res.render('transactionsstu', {
			transactions: transactions,
			classRoom: classRoom
		})
	})
}
})
})
router.get('/classRoom/:id', function(req, res, next){
	ClassRoom.findById(req.params.id).exec(function(error, classRoom){

	if(classRoom.owner + "" === req.user.id + "") {
	
		ClassRoomAssignment.find({"classRoom":req.params.id}).populate('assignment').lean().exec(function(err, assignments){
			var assignmentRet = [];

			var asyncCall = new Promise(function(resolve, reject){

				if(assignments.length === 0) {
					resolve(assignmentRet);
				} else {


				assignments.forEach(function(item, index){
					Day.find({'assignment': item.assignment._id}).sort("number").lean().exec(function(err2, days){
							assignmentRet.push({assignment: item, days: days})
						if(index === assignments.length-1){
							resolve(assignmentRet)
						}	
					})
				})
				}
			})

			asyncCall.then(function(assignmentRet){

				var totalEC = 0;
		
						assignmentRet.sort(function(a,b){
							return new Date("" + b.assignment.assignment.expireAt) - new Date("" + a.assignment.assignment.expireAt)
						})

						assignmentRet.reverse();


						
						assignmentRet.forEach(function(item, index){
							console.log(item.assignment.assignment.expireAt);

							if (item.assignment.assignment.active) {
								totalEC = totalEC + item.assignment.assignment.extraCredit;
							}
							
							for(var x = 0; x < item.days.length; x++) {
								if(!item.days[x].active) {
									item['canDelete'] = false;
									break;
								} else if (item.days[x].active && x === item.days.length-1) {
									item['canDelete'] = true;
								}

							}

						})

					

						ClassRoomUser.find({'classRoom': classRoom._id}).lean().exec(function(error, classRoomUser){

							var count = 0;

							Transaction.find({'classRoom': classRoom._id, 'extraCreditReceived': {$lt: 1}}).exec(function(error, transactions) {

								classRoomUser.forEach(function(item, index){
									count+=item.gronks;
								})

								transactions.forEach(function(item, index){
									count+=item.spent;
								})

								console.log(count);

								res.render('classroom', {
									count: count,
									name: classRoom.name,
									college: classRoom.college,
									classId: classRoom._id,
									totalEC: totalEC,
									assignments: assignmentRet
								})


							})
						})
				
			})
		})
	} else {

	ClassRoomUser.find({'user' : req.user.id, 'classRoom' : req.params.id}).exec(function(error, classroomUser){
		ClassRoomAssignment.find({"classRoom": req.params.id}).populate('assignment').lean().exec(function(err, assignments){
			
			ret = assignments.sort(function(a,b){
							return new Date("" + b.assignment.expireAt) - new Date("" + a.assignment.expireAt)
				 })

				ret.reverse();

			if(classroomUser.length > 0){
				
				var count = 0;
				var extraCreditRec = 0;
				var weightCreditRec = 0;

				ClassRoomUser.find({'classRoom': req.params.id}).lean().exec(function(error, classRoomUsers){

					Transaction.find({'classRoom': req.params.id, 'extraCreditReceived': {$lt: 1}}).exec(function(error, transactions) {

						classRoomUsers.forEach(function(item, index){
							count+=item.gronks;
						})
						transactions.forEach(function(item, index){
							count+=item.spent;
						})

						Transaction.find({'classRoom': req.params.id, 'extraCreditReceived': {$gt: 1}, 'user': req.user.id}).lean().exec(function(error1, transactionsUser){

							transactionsUser.forEach(function(item, index){
								extraCreditRec+=item.extraCreditReceived;
								weightCreditRec+=item.weightedCreditReceived;
							})

							res.render('classroomstujoin', {
								name: classRoom.name,
								totalGronks: count,
								college: classRoom.college,
								assignments: ret,
								classRoomUser: classroomUser[0],
								eCRec: extraCreditRec,
								weighted: weightCreditRec, 
								classId: classRoom._id
							})
						})
					})
			})
			} else {
				
				console.log(assignments);

						res.render('classroomstuNew', {
							name: classRoom.name,
							id: classRoom._id,
							college: classRoom.college,
							professor: classRoom.professor,
							createdAt: classRoom.createdAt,
							assignments: ret
						});

		    	
		}
		})
	})
	}
   })
})

router.get('/join/:id', function(req, res, next) {
	var cRU = new ClassRoomUser({
		user: req.user.id,
		classRoom: req.params.id
	})

	cRU.save(function(errpr, classRoomUser){
		res.redirect('/classroom/' + req.params.id);
	})
})

router.get('/day/:id', function(req, res, next){

	Day.findById(req.params.id).populate('assignment classRoom').lean().exec(function(error, day){
		ClassRoomUser.find({'classRoom' : day.classRoom}).populate('user').lean().exec(function(err, classRoomUser){
			
			console.log(day);
			console.log(classRoomUser);

			classRoomUser.sort(function(a,b){
					console.log('a', a)
				if(a.user.lastName < b.user.lastName) return -1;
    			if(a.user.lastName > b.user.lastName) return 1;
   				return 0;
			})

			res.render('day', {
				name: day.classRoom.name,
				college: day.classRoom.college,
				classRoomId: day.classRoom._id,
				assignment: day.assignment.name,
				assignmentId: day.assignment._id,
				number: day.number,
				day: day._id,
				wage: day.wage,
				classRoomUser: classRoomUser
			})


		})

	})
})

router.get('/classRoomBalance/:id', function(req, res, next) {
	ClassRoom.findById(req.params.id).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id + "") {
			res.redirect('/home');
		} else {
			ClassRoomUser.find({'classRoom': req.params.id}).populate('user').lean().exec(function(error, classRoomUsers){
			
					classRoomUsers.sort(function(a,b){
							
							if(a.user.lastName < b.user.lastName) return -1;
    						if(a.user.lastName > b.user.lastName) return 1;
   							return 0;
						})
				res.render('classRoomBalance', {
					classRoomUsers:classRoomUsers,
					classRoom: classRoom
				});
			})
		}
	})
})

router.get('classRoomTransactions/:id', function(req, res, next) {
	
})

router.get('/assignment/:id', function(req, res, next){

	ClassRoomAssignment.findOne({'assignment': req.params.id}).populate('classRoom').lean().exec(function(error, classRoomAssignment){
		console.log('classRoomAssign', classRoomAssignment.classRoom);
	Assignment.findById(req.params.id).lean().exec(function(error, assignment){
		Transaction.findOne({'assignment': req.params.id, 'user': req.user.id}).populate('user').lean().exec(function(error1, transaction){
			console.log(transaction)
			console.log(req.user.id);
			if(transaction) {
				res.render('assignstu', {
				name: assignment.name,
				weight: assignment.weight,
				averageWage: assignment.averageWage,
				supply: assignment.extraCredit,
				inflation: assignment.inflation,
				price: assignment.price,
				weightedPrice: assignment.weightedPrice,
				transaction: transaction,
				classRoom: classRoomAssignment.classRoom
				})
			} else {
					Transaction.find({'assignment': req.params.id}).populate('user classRoom').lean().exec(function(error2, transactions){

						console.log(assignment);
						console.log("transactions", transactions);
					

						if(transactions.length > 0 && transactions[0].classRoom.owner + "" === req.user.id){
							transactions.sort(function(a,b){
								console.log('a', a)
								if(a.user.lastName < b.user.lastName) return -1;
    							if(a.user.lastName > b.user.lastName) return 1;
   								return 0;
							})


							res.render('assign', {
								name: assignment.name,
								weight: assignment.weight,
								averageWage: assignment.averageWage,
								supply: assignment.extraCredit,
								inflation: assignment.inflation,
								price: assignment.price,
								weightedPrice: assignment.weightedPrice,
								transactions: transactions,
								classRoom: classRoomAssignment.classRoom
							})
						} else {
							res.render('assignnil', {
								name: assignment.name,
								weight: assignment.weight,
								averageWage: assignment.averageWage,
								supply: assignment.extraCredit,
								inflation: assignment.inflation,
								price: assignment.price,
								weightedPrice: assignment.weightedPrice,
								classRoom: classRoomAssignment.classRoom
							})
						}

					})


			}
		})

	})
})

})



router.get('/students/:id', function(req, res, next){

	ClassRoom.findById(req.params.id).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id) {
			res.redirect('/accessDenied')
		} else {
			ClassRoomUser.find({'classRoom': req.params.id}).populate('user').lean().exec(function(err, classRoomUser){
				console.log(classRoomUser);
				
				classRoomUser.sort(function(a,b){
					console.log('a', a)
					if(a.user.lastName < b.user.lastName) return -1;
    				if(a.user.lastName > b.user.lastName) return 1;
   					return 0;
				})

				res.render('student', {
					classRoom: classRoom,
					classRoomUser: classRoomUser
				})
			})
		}
	})
})

router.get('/charts/:id', function(req, res, next){

	ClassRoom.findById(req.params.id).lean().exec(function(error, classRoom){
		if(req.user.id + "" === classRoom.owner +"") {
			var owner = true;
		} else {
			var owner = false;
		}
		ClassRoomAssignment.find({'classRoom': req.params.id}).populate('assignment').lean().exec(function(error1, classRoomAssigns){
			
			classRoomAssigns.sort(function(a,b){
				return new Date(a.assignment.expireAt) - new Date(b.assignment.expireAt)
			})

			console.log(classRoomAssigns);

			var price = [];
			var averageWage = [];
			var inflation = [];
			var weightedPrice = [];
			var labels = [];

			classRoomAssigns.forEach(function(item, index){
				price.push(item.assignment.price);
				averageWage.push(item.assignment.averageWage);
				inflation.push(item.assignment.inflation);
				weightedPrice.push(item.assignment.weightedPrice);
				labels.push(item.assignment.name);
			})


			res.render('chart', {
				name: classRoom.name,
				college: classRoom.college,
				price: price,
				averageWage: averageWage,
				inflation: inflation,
				weightedPrice: weightedPrice,
				labels: labels,
				classId: classRoom._id,
				owner: owner
			})

		})
	})
})

router.get('/delete/:id', function(req, res, next){
	Assignment.findById(req.params.id).remove().exec(function(error, assign){
		ClassRoomAssignment.find({"assignment" : req.params.id}).exec(function(error, classRoomAssignment){
			classId = classRoomAssignment[0].classRoom;
			Day.find({"assignment" : req.params.id}).remove().exec(function(error, days){
				ClassRoomAssignment.find({"assignment": req.params.id}).remove().exec(function(error, stuff){
					res.redirect('/classRoom/' + classId);
				})
			})
		})
	})
})

router.get('/settings', function(req, res, next){
	User.findById(req.user.id).lean().exec(function(error, user){
		console.log(user);
		res.render('profileset', {
			user: user
		})
	})
})

router.post('/settings', function(req, res, next){
	User.findByIdAndUpdate(req.user.id, {'firstName' : req.body.firstName, 'lastName': req.body.lastName, 'email': req.body.email}).exec(function(error, user){

		res.redirect('/settings')

	})
})

router.get('/market_settings/:id', function(req, res, next) {
	ClassRoom.findById(req.params.id).populate('owner').exec(function(error, classRoom) {
		console.log('classRoom', classRoom);

		res.render('marketset', {
			name: classRoom.name,
			classId: classRoom._id,
			college: classRoom.college,
			professor: classRoom.professor
		})


	})
})

router.post('/market_settings/:id', function(req, res, next) {
	ClassRoom.findById(req.params.id).exec(function(error, classRoom){
		if (classRoom.owner + "" === req.user.id + "") {
			ClassRoom.findByIdAndUpdate(req.params.id, {name: req.body.name, college: req.body.college}).exec(function(error, classRoom1){

				res.redirect('/market_settings/' + classRoom._id);
			})
		} else {
			res.render('marketset', {
				error: 'You do no own this classroom'
			})
		}
	})
})

router.get('/delete_account', function(req, res, next){
	User.findById(req.user.id).exec(function(error, user) {
		if(user.professor){
			ClassRoom.find({'owner': req.user.id}).exec(function(error, classRooms) {
				var asyncCall = new Promise(function(resolve,reject){
					classRooms.forEach(function(item, index){
						ClassRoomUser.find({'classRoom': item._id}).remove().exec(function(error, classRoomUser) {
							Day.find({'classRoom': item._id}).remove().exec(function(error, day){
								Transaction.find({'classRoom': item._id}).remove().exec(function(error, day){
									ClassRoomAssignment.find({'classRoom':item._id}).exec(function(error, classRoomAssign){


										var asyncCall1 = new Promise(function(resolve1, reject1){
											classRoomAssign.forEach(function(item1, index1){
												Assignment.findById(item1.assignment).remove().exec(function(error, assign){
													if(index1 === classRoomAssign.length-1){
														resolve1('assignments deleted')
													}
												})
											})
										})

										asyncCall1.then(function(resolve1){
											ClassRoomAssignment.find({'classRoom': item._id}).remove().exec(function(error, classRA){
												if(index === classRooms.length-1){
													resolve('deleted all prelim')
												}

											})
											

										})

									})
								})
							})
						})
					})
				})

				asyncCall.then(function(resolve){
					ClassRoom.find({'owner': req.user.id}).remove().exec(function(error, classRooms1){
						User.findById(req.user.id).remove().exec(function(error, user){
							console.log('user deleted');
							res.render('login', {
								error: "Your Account has Been Deleted"
							})
						})
					})
				})
			})
		} else {
			Transaction.find({'user':req.user.id}).remove().exec(function(error, trans){
				ClassRoomUser.find({'user': req.user.id}).remove().exec(function(error, classRoomUser){
					User.findById(req.user.id).remove().exec(function(error, user){
						console.log('user deleted');
							res.render('login', {
								error: "Your Account has Been Deleted"
							})
					})
				})
			})
		}
	})
})

router.get('/delete_class/:id', function(req, res, next){
	ClassRoom.findById(req.params.id).exec(function(error, classRoom){
		if(classRoom.owner +"" === req.user.id + ""){
			ClassRoomUser.find({'classRoom': req.params.id}).remove().exec(function(error, classRoomUser){

				Day.find({'classRoom': req.params.id}).remove().exec(function(error, days) {

					Transaction.find({'classRoom': req.params.id}).remove().exec(function(error, transaction){

						ClassRoom.findById(req.params.id).remove().exec(function(error, classRoom1){

							ClassRoomAssignment.find({'classRoom' : req.params.id}).exec(function(error, classRoomAssigns){

								console.log('classRoomAssigns', classRoomAssigns);

								var asyncCall = new Promise(function(resolve, reject){

									if(classRoomAssigns.length === 0) {
										resolve(classRoomAssigns);
									} else {


									classRoomAssigns.forEach(function(item, index){
										Assignment.findById(item.assignment).remove().exec(function(err2, assign){
											if(index === classRoomAssigns.length-1){
												resolve(classRoomAssigns);
											}	
										})
									})
									}
								})

								asyncCall.then(function(classRoomAssigns){
									console.log('resolved');
									ClassRoomAssignment.find({'classRoom': req.params.id}).remove().exec(function(error, classRoomAss) {

											res.redirect('/home')

									})
								})




							})

						})

					})

				})


			})
		}
	})
})


module.exports = router;
