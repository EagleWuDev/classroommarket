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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
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
			console.log("classrooms", classRoom)
					lastname = user.username.split(' ').slice(-1).join(' ');
						res.render('homeprof', {
							name: lastname,
							activeNum: classRoom.length,
							classRoom: classRoom
						})
					})	
		} else {
			console.log(user)
			ClassRoomUser.find({user: req.user.id}).populate('classRoom').lean().exec(function(error, classRoomUser){

					console.log('classRoomUsers', classRoomUser)
					res.render('homestu', {
						name: user.username,
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
			professor: user.username,
			createdAt: new Date()
		})

		classRoom.save(function(error, classRoom){
			console.log('save');
			console.log(classRoom);
			res.redirect('/classRoom/' + classRoom._id);
		})

	})
})

router.get('/classRoom/:id', function(req, res, next){
	ClassRoom.findById(req.params.id).exec(function(error, classRoom){

	if(classRoom.owner + "" === req.user.id + "") {
	
		ClassRoomAssignment.find({"classRoom":req.params.id}).populate('assignment').sort('assignment.expireAt').lean().exec(function(err, assignments){
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
		
				if(classRoom.owner + "" === req.user.id + ""){

						assignmentRet.sort(function(a,b){
							return new Date("" + b.assignment.assignment.expireAt) - new Date("" + a.assignment.assignment.expireAt)
						})

						assignmentRet.reverse();

					
						assignmentRet.forEach(function(item, index){
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
				} else {
					res.send('fuckkkkk')
				}
			})
		})
	} else {

	ClassRoomUser.find({'user' : req.user.id, 'classRoom' : req.params.id}).exec(function(error, classroomUser){
		ClassRoomAssignment.find({"classRoom": req.params.id}).populate('assignment').sort('assignment.expireAt').lean().exec(function(err, assignments){
		
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
								assignments: assignments,
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
							assignments: assignments
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

			res.render('day', {
				name: day.classRoom.name,
				college: day.classRoom.college,
				classRoomId: day.classRoom._id,
				assignment: day.assignment.name,
				assignmentId: day.assignment._id,
				number: day.number,
				day: day._id,
				classRoomUser: classRoomUser
			})


		})

	})
})

router.get('/assignment/:id', function(req, res, next){

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
				transaction: transaction
				})
			} else {
					Transaction.find({'assignment': req.params.id}).populate('user classRoom').lean().exec(function(error2, transactions){

						console.log(assignment);
						console.log("transactions", transactions);

						if(transactions[0].classRoom.owner + "" === req.user.id){
							res.render('assign', {
								name: assignment.name,
								weight: assignment.weight,
								averageWage: assignment.averageWage,
								supply: assignment.extraCredit,
								inflation: assignment.inflation,
								price: assignment.price,
								weightedPrice: assignment.weightedPrice,
								transactions: transactions
							})
						} else {
							res.render('assignnil', {
								name: assignment.name,
								weight: assignment.weight,
								averageWage: assignment.averageWage,
								supply: assignment.extraCredit,
								inflation: assignment.inflation,
								price: assignment.price,
								weightedPrice: assignment.weightedPrice
							})
						}

					})


			}
		})

	})

})



router.get('/students/:id', function(req, res, next){

	ClassRoom.findById(req.params.id).lean().exec(function(error, classRoom){
		if(classRoom.owner + "" !== req.user.id) {
			res.redirect('/accessDenied')
		} else {
			ClassRoomUser.find({'classRoom': req.params.id}).populate('user').lean().exec(function(err, classRoomUser){

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
				labels: labels
			})

		})
	})
})

router.get('/delete/:id', function(req, res, next){
	Assignment.findById(req.params.id).remove().exec(function(error, assign){
		ClassRoomAssignment.find({"assignment" : req.params.id}).exec(function(error, classRoomAssignment){
			console.log(classRoomAssignment);
			classId = classRoomAssignment[0].classRoom;
			Day.find({"assignment" : req.params.id}).remove().exec(function(error, days){
				ClassRoomAssignment.find({"assignment": req.params.id}).remove().exec(function(error, stuff){
					res.redirect('/classRoom/' + classId);
				})
			})
		})
	})
})

module.exports = router;
