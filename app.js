var express = require('express');
var app = express();
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var partials = require('express-partials');
var http = require('http');
var request = require('request');
var pretty = require('express-prettify');
var mongoose = require('mongoose');
//Including User model 
var userModel = require('./UserProf');
var repoModel = require('./Repos');
var UserProf = mongoose.model('UserProf');
var Repo = mongoose.model('Repo');
app.use(pretty({
    query: 'pretty'
}));


//Data Base Connection
var dbPath = "mongodb://localhost/GithubUserInfoApp";
mongoose.connect(dbPath);
mongoose.connection.once('open', function () {
    console.log("Database Connection Established Successfully...");
});


var accesstoken;
//Github Client ID and Client Secret
var GITHUB_CLIENT_ID = "22547ded1277b051f52e";
var GITHUB_CLIENT_SECRET = "fd9e30b64e49b0b244880028b6bb74eaf3be6b1e";

//serialization Of Passport
passport.serializeUser(function (user, done) {
    done(null, user);
});

//deserialization of Passport
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

//Passport strategy
passport.use(new GitHubStrategy({
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        scope: ['user:email', 'repo'],
        callbackURL: "http://localhost:3000/auth/github/callback"
    },
    function (accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        console.log(accessToken);
        console.log(profile);
        accesstoken = accessToken;
        process.nextTick(function () {
            return done(null, profile);
        });
    }
));


// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    secret: 'uhahday%#@)>Lnajal',
    resave: false,
    saveUninitialized: false
}));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());


app.get('/', ensureAuthenticated, function (req, res) {
    UserProf.find(function (err, result) {
        if (err) {
            res.status(200).send("Sorry! Some error has occured... " + err);
        } else if (result.length !== 0) {
            console.log(result.length);
            for (var i = 0; i < result.length; i++) {
                if (result[i].usergit[i].id == req.user.id) {
                    console.log("************************:this is User Profile :********************************");
                    req.session.email = req.user.emails[0].value;
                    console.log(req.session.email);
                    //res.send(result[i].usergit[i]._json);
                    res.send(result[i]);
                }
            }
        } else {
            var userprofile = new UserProf();
            userprofile.usergit.push(req.user);
            userprofile.name = req.user.username;
            userprofile.email = req.user.emails[0].value;
            userprofile.save();
            req.session.email = req.user.emails[0].value;
            console.log(req.session.email);
            res.send("user Saved successfully!!!");
        }
    })
});


//Can accesssible only after user Logged in.....
//API to add the user repos details to Database Public as well as private...
app.get('/repos/details', ensureAuthenticated, function (req, res) {
    UserProf.find({
        email: req.session.email
    }, function (err, user) {
        if (err) {
            res.status(200).send("Sorry! Some error has occured..." + err);
        } else if (user) {
            console.log("*************************:User found:************************");
            Repo.find({
                email: req.session.email
            }, function (err, result) {
                if (err) {
                    res.status(200).send("Sorry! Some error has occured... " + err);
                } else if (result.length == 0) {
                    request({
                        url: 'https://api.github.com/user/repos?access_token=' + accesstoken,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36',
                            "access_token": accesstoken,
                            "scope": "repo,user:email",
                            "token_type": "bearer"
                        }

                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log("*****************************: repository added to the collection :*************************");
                            var repos = new Repo();
                            var str = JSON.parse(body);
                            repos.repository = str;
                            repos.email = req.session.email;
                            repos.save();
                            console.log("Repository Has been saved in the Database");
                            res.send(str);
                        } else {

                            res.send("Unable to fetch the Repository from Github!");
                        }
                    });
                } else {
                    request({
                        url: 'https://api.github.com/user/repos?access_token=' + accesstoken,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36',
                            "access_token": accesstoken,
                            "scope": "repo,user:email",
                            "token_type": "bearer"
                        }

                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log("*****************************: Updated repository added to the collection :*************************");
                            var str = JSON.parse(body);
                            result.repository = str;
                            console.log("Repository Has been updated in the Database");
                            res.send(str);
                        } else {
                            res.send("Unable to update the Repository from Github!");
                        }
                    });
                }
            })
        }
    })
})

//API to calculate the amount and kind of code user has done...
app.get('/users/repository/codecalc', ensureAuthenticated, function (req, res) {

//Didn't Done yet to complete...

});

app.get('/login', function (req, res) {
    res.render('login', {
        user: req.user
    });
});

app.get('/auth/github',
    passport.authenticate('github', {
        scope: ['user:email', 'repo']
    }),
    function (req, res) {});

app.get('/auth/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(3000);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}
