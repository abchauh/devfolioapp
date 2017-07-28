//Including Mongoose model...
var mongoose = require('mongoose');
//creating object 
var Schema = mongoose.Schema;

var repoSchema = new Schema({

	email:{type:String},
	repository:''

});

mongoose.model('Repo',repoSchema);
