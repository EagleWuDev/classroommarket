var express = require('express');
var User = require('../models/models').User;
var router = express.Router();
// GET registration page
router.get('/register', function(req, res) {
  res.render('register');
});

// POST registration page
var validateReq = function(userData) {
  return (userData.username && userData.password && userData.email &&
    (userData.password === userData.passwordRepeat));
};

router.post('/register', function(req, res, next) {
  // validation step
  if (!validateReq(req.body)) {
    return res.render('register', {
      error: "Fields missing or passwords don't match",
      data: req.body
    });
  }

  // Don't create duplicate users
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) return next(err);
    if (user)
      return res.render('register', {
        error: "This email address is already registered"
      });
		var u = new User({
		      // username is phone number
		      username: req.body.username,
		      email: req.body.email,
		      password: req.body.password,
		    });
		    u.save(function(err, user) {
		      if (err) {
		        console.log(err);
		        res.status(500).redirect('/register');
		        return;
		      }
		      console.log("Created new user:");
		      console.log(user);
		      res.redirect('/login');
		  })
	})
});

  module.exports = router;
