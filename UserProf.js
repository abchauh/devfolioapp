//Including Mongoose model...
var mongoose = require('mongoose');
//creating object 
var Schema = mongoose.Schema;

var userSchema = new Schema({

	usergit : []

});

mongoose.model('UserProf',userSchema);
