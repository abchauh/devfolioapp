var express = require('express');
var app = express();
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var partials = require('express-partials');
var http=require('http');
var pretty = require('express-prettify');
var mongoose = require('mongoose');
//Including User model 
var userModel = require('./UserProf');
var UserProf = mongoose.model('UserProf');
app.use(pretty({ query: 'pretty' }));


//Data Base Connection
var dbPath = "mongodb://localhost/GitHubdatabase";
mongoose.connect(dbPath);
mongoose.connection.once('open',function(){
  console.log("Database Connection Established Successfully...");
});


var GITHUB_CLIENT_ID = "a6ee35e7724a9f013edc";
var GITHUB_CLIENT_SECRET = "d636b6df2cbcd639d7608ca13e8203c209f28a07";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

//Including passport strategy
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    scope: ['user:email'],
    callbackURL: "http://localhost:3000/auth/github/callback"
  
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    console.log(accessToken);
    console.log(profile);
    process.nextTick(function () {
      
      return done(null, profile);
    });
  }
));



// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ secret: 'uhahday%#@)>Lnajal', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


 
app.get('/',ensureAuthenticated, function(req, res){

console.log(req.user.id);
UserProf.find(function(err,result){
    if(err)
    {
      res.status(200).send("Sorry! Some error has occured..."+err);
    }
    else if (result.length !== 0)
    {
      //console.log(result.length);
      for(var i=0;i<result.length;i++)
      {
        if(result[i].usergit[i].id == req.user.id)
        {
          //console.log("this is User");
        res.send(result[i].usergit[i]._json);
        }
      }      
      
    }
      else
      {
       
       var userprofile = new UserProf();
       userprofile.usergit.push(req.user);
       userprofile.save();
        res.send("user Saved successfully!!!");
       }
    })
});

app.get('/user',function(req,res){
UserProf.find(function(err,user){
    if(err)
    {
      res.status(200).send("Sorry! Some error has occured..."+err);
    }
    else if (user)
    {
      //console.log("this is User");
        res.send(user);
    }
    })
})


app.get('/account', ensureAuthenticated, function(req, res){


  res.status(200).send(req.user);

});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email'] }),
  function(req, res){
  });

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
