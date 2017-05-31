var express = require('express');
var router = express.Router();
var User = require('../models/models').User;
var helper = require('sendgrid').mail;

module.exports = function(passport, mongoStore) {

  function restoreSession(req, res, next) {
    // Check for a saved session ID
    if (req.user.sessionId) {
      console.log("User has saved session ID: " + req.user.sessionId);
      mongoStore.get(req.user.sessionId, function(err, session) {      
          // Save session ID to user object
          // We do this regardless of whether or not we restored a session
          User.findByIdAndUpdate(req.user._id, {sessionId: req.session.id}, function(err) {
            console.log('success');
            next(err);
          });
      });
    } else {
      // Save session ID to user object
      // We do this regardless of whether or not we restored a session
      User.findByIdAndUpdate(req.user._id, {sessionId: req.session.id}, function(err) {
        next(err);
      });
    }
  }
  router.get('/password_reset', function(req, res, next) {
  res.render('reset')
})

router.post('/password_reset', function(req, res, next) {
  User.findOne({'email': req.body.reset_email}).lean().exec(function(error, user){

    error ? console.log(error) : console.log(user);
    if(!user){
      res.render('reset', {
        error:'That email does not match our record'
      });
    } else {
     var from_email = new helper.Email('passwordreset@classroommarket.org');
            var to_email = new helper.Email(user.email);
            var subject = 'Reset Your Password';
            var content = new helper.Content('text/plain', 'Hi ' + user.username+ '! Click this link to reset your password: ' + ' https://classroommarket.herokuapp.com/password_reset_confirm/' + user._id);
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
                if (err) { 
                  return next(err); 
                }
                  User.findByIdAndUpdate(req.user._id, {sessionId: req.session.id}, function(err) {
                      console.log(req.session);
                       res.redirect('/confirm');
                    });
              });
          })
    }
    })
})

// POST registration page
var validateReq = function(userData) {
  return (
    (userData.password === userData.passwordRepeat));
};


router.get('/password_reset_confirm/:id', function(req, res, next) {
  res.render('resetPass');
})

router.post('/password_reset_confirm/:id', function(req, res, next) {
  if(validateReq(req.body)){
    User.findByIdAndUpdate(req.params.id, {'password' : req.body.password}).exec(function(error, user){

      res.redirect('/login')
    })
  } else {
    res.render('resetPass', {
      error: 'Passwords Do No Match'
    })
  }
})

router.get('/confirm', function(req, res, next){
  res.render('confirm');
})

  // GET Login page
  router.get('/login', function(req, res) {
    res.render('login');
  });

  // POST Login page
  // Custom handler, to handle the verify case.
  router.post('/login', function(req, res, next) {
    console.log('body', req.body);
    passport.authenticate('local', function(err, user, info) {
      
      if (err) { return next(err); }
      if (!user) { return res.render('login', {error:'The Email or Password you entered did not match our record'}); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        next();
      });
    })(req, res, next);
  }, restoreSession, function(req, res) {
    // Successful authentication, redirect home.
    console.log('in next part');
    res.redirect('/home');
  });

  // GET Logout page
  router.get('/logout', function(req, res) {
    // Req.logout doesn't remove the session!
    req.logout();

    // We need this to remove the session so another user logging in
    // won't see the same session.
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });

  return router;
};