const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {DateTime} = require('luxon');

const AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, maxlength: 100},
        family_name: {type: String, required: true, maxlength: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

AuthorSchema
 .virtual('lifespan')
 .get(function(){
    return (this.date_of_death && this.date_of_birth)?((this.date_of_death.getYear() - this.date_of_birth.getYear()).toString()):'n/a';
});

AuthorSchema
 .virtual('url')
 .get(function(){
    return '/catalog/author/' + this._id;
});

AuthorSchema
 .virtual('name')
 .get(function(){
    return this.family_name + ', ' + this.first_name;
});

AuthorSchema
 .virtual('date_of_birth_formatted')
 .get(function(){
    return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : '';
});

AuthorSchema
 .virtual('date_of_death_formatted')
 .get(function(){
    return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
});

module.exports = mongoose.model('Author', AuthorSchema);