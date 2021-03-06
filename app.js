var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var session = require('express-session');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport   = require('passport');
var LocalStrategy = require('passport-local');
var mongoose    = require('mongoose');
var MongoStore  = require('connect-mongo')(session);
var User = require('./models/models').User;

//define route paths
var index = require('./routes/index');
var auth  = require('./routes/auth');
var register = require('./routes/register');
var calls = require('./routes/calls');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//setting connection
var connect = process.env.MONGODB_URI || require('./models/connect');
mongoose.connect(connect);
var mongoStore = new MongoStore({mongooseConnection: mongoose.connection});

//storing sessions in dB for security
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

// ----------------------------------------------
// Passport Verification - Local Strategy
// ----------------------------------------------
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport Local strategy
passport.use(new LocalStrategy(function(username, password, done) {
    // Find the user with the given username
    User.findOne({ email: username.toLowerCase() }, function (err, user) {
      // if there's an error, finish trying to authenticate (auth failed)
      if (err) {
        console.error(err);
        return done(err);
      }
      // if no user present, auth failed
      if (!user) {
        console.log(user);
        return done(null, false, { message: 'Incorrect username.' });
      }
      // if passwords do not match, auth failed
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      // auth has has succeeded
      return done(null, user);
    });
  }
));

// ----------------------------------------------
// Route Setting
// ----------------------------------------------

app.use('/', calls);
app.use('/', auth(passport, mongoStore));
app.use('/', register);
app.use('/', index);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
