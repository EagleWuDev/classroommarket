var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	username: String,
	firstName: String,
	lastName: String,
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
	professor: String,
	createdAt: Date,
	college: String
})

classRoomSchema.index({name: 'text', professor: 'text', college: 'text'},
		{"weights": {name: 10, professor: 5, college: 2}})

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
	},
	surveyActivate: {
		type: Boolean,
		default: false
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
	wage: {
		type: Number,
		default: 1
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
	classRoom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ClassRoom'
	},
	spent: {
		type: Number,
		default: 0
	},
	extraCreditReceived: {
		type: Number,
		default: 0
	},
	weightedCreditReceived: {
		type: Number,
		default: 0
	},
	updated: {
		type: Boolean,
		default: false
	}
})

var classRoomAssignmentSchema = mongoose.Schema({
	classRoom: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ClassRoom'
	},
	assignment: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Assignment'
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
	weightedPrice: {
		type: Number
	},
	inflation: {
		type: Number
	},
	active: Boolean,
	weight: {
		type: Number
	},
	extraCredit: {
		type: Number,
		default: 0
	},
	lastDay: {
		type: Number,
		default: 1
	},
	averageWage: {
		type: Number,
		default: 1
	},
	lastAssign: {
		type: Boolean
	}
})


var surveyResultsSchema = mongoose.Schema({
	one: Number,
	two: Number,
	three: Number,
	four: Number,
	five: Number,
	six: Number,
	seven: Number,
	sOne: String,
	sTwo: String,
	sThree: String,
	sFour: String
});

var surveyUserClassRoomSchema = mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	surveyId: {
		type: mongoose.Schema.Types.ObjectId,
		ref:'SurveyResult'
	},
	classRoomId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ClassRoom'
	}
});


module.exports = {
	User: mongoose.model('User', userSchema),
	ClassRoom: mongoose.model('ClassRoom', classRoomSchema),
	Day: mongoose.model('Day', daySchema),
	Assignment: mongoose.model('Assignment', assignmentSchema),
	ClassRoomUser: mongoose.model('ClassRoomUser', classRoomUserSchema),
	ClassRoomAssignment: mongoose.model('ClassRoomAssignment', classRoomAssignmentSchema),
	Transaction: mongoose.model('Transaction', transactionSchema),
	SurveyResult: mongoose.model('SurveyResult', surveyResultsSchema),
	SurveyUserClassRoom: mongoose.model('SurveyUserClassRoom', surveyUserClassRoomSchema)
}
