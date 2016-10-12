var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	username: String,
	email: String,
	password: String,
	sessionId: String
});

var profSchema = mongoose.Schema({
	name: String,
	email: String
});

module.exports = {
	User: mongoose.model('User', userSchema),
	Prof: mongoose.model('Prof', profSchema)
}
