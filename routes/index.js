var express = require('express');
var router = express.Router();
var User = require('../models/models').User;
var ClassroomUser = require('../models/models').ClassroomUser;
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
			lastname = user.username.split(' ').slice(-1).join(' ');
				res.render('homeprof', {
					name: lastname
				})
			
		} else {
			res.render('homestu')
		}

	})
})

router.post('/home', function(req, res, next){
	var classRoom = new ClassRoom({
		name: req.body.className,
		college: req.body.collegeName,
		owner: req.user.id,
		createdAt: new Date()
	})

	classRoom.save(function(error, classRoom){
		error ? console.log("error", error) : null;

		res.redirect('/classRoom/' + classRoom._id);
	})
})

router.get('/classRoom/:id', function(req, res, next){

	ClassRoom.findById(req.params.id).exec(function(error, classRoom){

		if(classRoom.owner + "" === req.user.id + ""){
				res.render('classroom', {
				name: classRoom.name,
				college: classRoom.college
			})
		}
	})
})

router.post('/classRoom/:id', function(req, res, next){

	var assign = new Assignment({
		name: req.body.assignName,
		expireAt: req.body.assignDate,
		active: true,
		weight: req.body.assignWeight
	})

	assign.save(function(error, assign){
		error ? console.log(error) : null

		var classRoomAssign = new ClassRoomAssignment({
			classRoom: req.params.id,
			assignment: assign._id
		})

		classRoomAssign.save(function(error, cRA){
			error ? console.log(error) : null

			for(var i = 0 ; i < req.body.assignDays; i++){
				var day = new Day({
					classRoom: req.params.id,
					assignment: assign._id,
					number: i+1,
					active: true
				})

				day.save(function(error, day){
					error ? console.log(error) : null
				})
			}
			res.redirect('/classRoom/' + req.params.id)
		})

	})

})

module.exports = router;
