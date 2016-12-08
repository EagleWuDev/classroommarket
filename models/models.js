var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	username: String,
	email: String,
	password: String,
	sessionId: String,
	professor: {
		type: Boolean,
		default: false
	},
	college: String,
	verified: {
		type: Boolean,
		default: false
	},
	verifyExpiration: Date,
	verifyCode: Number
});

var classRoomSchema = mongoose.Schema({
	name: String,
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}, 
	createdAt: Date,
	college: String
})

var classRoomUserSchema = mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	classRoom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ClassRoom'
	},
	gronks: {
		type: Number,
		default: 0
	}
})

var daySchema = mongoose.Schema({
	classRoom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ClassRoom'
	},
	assignment: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Assignment'
	},
	extraCredit: {
		type: Number,
		default: 0
	},
	number: {
		type: Number
	},
	active: Boolean
})

var transactionSchema = mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	assignment: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Assignment'
	},
	spent: {
		type: Number,
		default: 0
	},
	extraCreditReceived: {
		type: Number,
		default: 0
	}
})

var classRoomAssignmentSchema = mongoose.Schema({
	classRoom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'classRoom'
	},
	assignment: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'assignment'
	}
})

var assignmentSchema = mongoose.Schema({
	name: {
		type: String
	},
	expireAt: {
		type: Date
	},
	price: {
		type: Number
	},
	inflation: {
		type: Number
	},
	active: Boolean,
	weight: {
		type: Number
	}
})




module.exports = {
	User: mongoose.model('User', userSchema),
	ClassRoom: mongoose.model('classRoom', classRoomSchema),
	Day: mongoose.model('Day', daySchema),
	Assignment: mongoose.model('Assignment', assignmentSchema),
	ClassRoomUser: mongoose.model('ClassRoomUser', classRoomUserSchema),
	ClassRoomAssignment: mongoose.model('ClassRoomAssignment', classRoomAssignmentSchema),
	Transaction: mongoose.model('Transaction', transactionSchema)
}
