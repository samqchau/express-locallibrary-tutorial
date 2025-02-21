const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const {body, validationResult} = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function(err, genres){
            if(err) {return next(err);}
            res.render('genre_list', {title: 'Genre List', genre_list: genres});
        });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: (callback) => {
            Book.find({'genre': req.params.id})
                .exec(callback);
        },

    }, (err, results) => {
        if(err) { return next(err); }
        if(results.genre===null){
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    //Validate and sanitise the name field.
    body('name', 'Genre name required').trim().isLength({min: 1}).escape(),

    //Process request after validation and sanitization.
    (req, res, next) => {
        //Extract the validation errors from a request.
        const errors = validationResult(req);

        //Create a genre object with escaped and trimmed data.
        const genre = new Genre({name: req.body.name});

        if(!errors.isEmpty()){
            //There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        } else{
            //Data from form is valid.
            //Check if Genre with same name already exists.
            Genre.findOne({name: req.body.name})
                .exec((err, found_genre) => {
                    if(err){return next(err);}
                    if(found_genre){
                        //Genre exists, redirect to its detail page
                        res.redirect(found_genre.url);
                    } else{
                        genre.save((err) => {
                            if(err) {return next(err);}
                            //Genre saved. Redirect to genre detail page.
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
   async.parallel({
       books_in_genre: (callback) => {
            Book.find({'genre': req.params.id}).populate('author').exec(callback);
       },
       genre: (callback) => {
            Genre.findById(req.params.id).exec(callback);
       }
   }, (err, results) => {
        if(err) { return next(err); }
        if(results.genre == null) { res.redirect('/catalog/genres'); }
        res.render('genre_delete', {title: 'Delete Genre', books: results.books_in_genre, genre: results.genre});
   });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    /*
    1. Get data from mongoose DB
    2. Handle errors
    3. If genre still has books re render same page
    4. If genre has no books, remove from database and go to list of genres
    */
    async.parallel({
        books: (callback) => {
            Book.find({'genre': req.body.genreid}).exec(callback);
        },
        genre: (callback) => {
            Genre.findById(req.body.genreid).exec(callback);
        }
    }, (err, results) => {
        if(err) { return next(err); }
        if( results.books.length > 0) { res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, books: results.books}) ;} else {
            Genre.findByIdAndRemove(req.body.genreid, (err) => { 
                if(err) { return next(err); }
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec((err, genre) => {
        if(err) { return next(err); }
        if(genre == null) { 
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_form', {title: 'Update Genre', genre: genre});
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name').trim().isLength({min: 3}).withMessage('Genre name must be at least 3 characters').escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });

        if(!errors.isEmpty()){
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        } else{
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
                if(err) { return next(err); }
                res.redirect(thegenre.url);
            });
        }
    }
];