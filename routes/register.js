var express = require('express');
var User = require('../models/models').User;
var router = express.Router();
var helper = require('sendgrid').mail;

//randomCode generator
function randomCode() {
  var min = 1000;
  var max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// GET registration page
router.get('/register', function(req, res) {
  res.render('register');
});

// POST registration page
var validateReq = function(userData) {
  return (userData.firstName && userData.lastName && userData.password && userData.email && userData.profession &&
    (userData.password === userData.passwordRepeat));
};

router.post('/register', function(req, res, next) {
  // validation step
  console.log(req.body);
  if (!validateReq(req.body)) {
    return res.render('register', {
      error: "Fields missing or passwords don't match",
      data: req.body
    });
  }

  // Don't create duplicate users
  User.findOne({email: req.body.email.toLowerCase()}, function(err, user) {
    if (err) return next(err);
    if (user)
      return res.render('register', {
        error: "This email address is already registered"
      });

    var professor = false;
    if (req.body.profession === 'Professor'){
      professor = true;
    }

    //create date object that is tomorrow
    var date = new Date();
    date.setDate(date.getDate() + 1);

    //save a new user to dB
		var u = new User({
		      firstName: req.body.firstName,
          lastName: req.body.lastName,
		      email: req.body.email.toLowerCase(),
		      password: req.body.password,
          professor: professor,
          verified: false,
          verifyExpiration: date,
          verifyCode: randomCode()
		    });
		    u.save(function(err, user) {
		      if (err) {
		        console.log(err);
		        res.status(500).redirect('/register');
		        return;
		      }
		      console.log("Created new user:");
		      console.log(user);

           var from_email = new helper.Email('verification@classroommarket.org');
            var to_email = new helper.Email(user.email);
            var subject = 'Verification Code for ClassroomMarket';
            var content = new helper.Content('text/plain', 'Hi ' + user.firstName+ '! Use this Code to verify: ' + user.verifyCode);
            var mail = new helper.Mail(from_email, subject, to_email, content);

            var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
            var request = sg.emptyRequest({
              method: 'POST',
              path: '/v3/mail/send',
              body: mail.toJSON(),
            });

            sg.API(request, function(error, response) {
              console.log(response.statusCode);
              console.log(response.body);
              console.log(response.headers);
              req.logIn(user, function(err) {
                if (err) { return next(err); }
                  User.findByIdAndUpdate(req.user._id, {sessionId: req.session.id}, function(err) {
                      console.log(req.session);
                       res.redirect('/verify');
                    });
              });
		        })
	})
});
})

router.get('/verify', function(req,res,next){
  res.render('verify')
})

router.post('/verify', function(req, res, next){
  User.findById(req.user.id, function(err, user){
    if(user.verifyCode + "" === req.body.code){
      User.findByIdAndUpdate(req.user.id, {verified: true}, function(err, user){
          res.redirect('/home')
        })
    } else {
      res.render('verify', {
        error: "Code doesn't Match"
      })
    }
  })
})

  module.exports = router;
