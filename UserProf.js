//Including Mongoose model...
var mongoose = require('mongoose');
//creating object 
var Schema = mongoose.Schema;

var userSchema = new Schema({

	name:{type:String},
	email:{type:String},
	usergit : []

});

mongoose.model('UserProf',userSchema);
