var express = require('express');
var router = express.Router();
var User = require('../models/models').User;
var ClassRoomUser = require('../models/models').ClassRoomUser;
var ClassRoom = require('../models/models').ClassRoom;
var Assignment = require('../models/models').Assignment;
var ClassRoomAssignment = require('../models/models').ClassRoomAssignment;
var Day = require('../models/models').Day;
var Transaction = require('../models/models').Transaction;

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
	console.log(req.user.id)
	ClassRoom.findById(req.params.id).exec(function(error, classRoom){

	if(classRoom.owner + "" === req.user.id + "") {
		console.log('in here');
		ClassRoomAssignment.find({"classRoom":req.params.id}).populate('assignment').sort('assignment.expireAt').lean().exec(function(err, assignments){

			console.log('assignments', assignments)
			var assignmentRet = [];

			var asyncCall = new Promise(function(resolve, reject){

				if(assignments.length === 0) {
					resolve(assignmentRet);
				} else {


				assignments.forEach(function(item, index){
					console.log(item);
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

				console.log('assignment')
				if(classRoom.owner + "" === req.user.id + ""){

					console.log("assignmentRet1stassignment");

						assignmentRet.sort(function(a,b){
							return new Date(a.assignment.assignment.expireAt) - new Date(b.assignment.assignment.expireAt)
						})

						console.log('sorted array', assignmentRet);
						console.log(classRoom._id)

						ClassRoomUser.find({'classRoom': classRoom._id}).lean().exec(function(error, classRoomUser){

							var count = 0;

							console.log(classRoomUser);


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
		console.log(classroomUser);
		ClassRoomAssignment.find({"classRoom": req.params.id}).populate('assignment').sort('assignment.expireAt').lean().exec(function(err, assignments){
		
			if(classroomUser.length > 0){
				
				res.render('classroomstujoin', {
					name: classRoom.name,
					college: classRoom.college,
					assignments: assignments,
					classId: classRoom._id
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
		Transaction.find({'assignment': req.params.id}).populate('user').lean().exec(function(error1, transactions){

			console.log(assignment);
			console.log(transactions);
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

		})

	})

})

module.exports = router;
