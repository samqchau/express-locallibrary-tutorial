const { nextTick } = require('async');
const {body, validationResult} = require('express-validator');
const async = require('async');

const Book = require('../models/book');
const BookInstance = require('../models/bookinstance');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if(err) {return next(err);}
            res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
        });
}

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance
        .findById(req.params.id)
        .populate('book')
        .exec((err, results)=>{
            if(err){return next(err)}
            if(results == null){
                const err = new Error('Book copy not found.');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_details', {title:'Copy: ' + results.book.title, bookinstance: results});
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title').exec((err, books) => {
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if(!errors.isEmpty()){
            Book.find({}, 'title').exec((err, books) => {
                if(err) {return next(err);}
                res.render('bookinstance_form', {title: 'Create Book Instance', book_list: books, selected_book: bookInstance.book._id, errors: errors.array(), bookinstance: bookInstance})
            });
        } else{
            bookInstance.save((err) => {
                if(err){return next(err);}
                res.redirect(bookInstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id).populate('book').exec((err, bookinstance) => {
        if(err) { return next(err); }
        if(bookinstance == null) { res.redirect('/catalog/bookinstances'); }
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: bookinstance });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) { 
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if(err) { return next(err); }
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        book_list: (callback) => {
            Book.find().populate('author').populate('genre').exec(callback);
        },
        instance: (callback) => {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        }
    }, (err, results) => {
        if(err) { return next(err); }
        if(results.instance == null) {
            const err = new Error ('Instance not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form', {title: 'Update Instance', book_list: results.book_list, bookinstance: results.instance});
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req);
        const body = req.body;
        const bookInstance = new BookInstance({
            book: body.book,
            imprint: body.imprint,
            status: body.status,
            due_back: body.due_back,
            _id: req.params.id
        });

        if(!errors.isEmpty()){
            BookInstance.findById(body.id).populate('book').exec((err, results) => {
                if(err) { return next(err); }
                res.render('bookinstance_form', {title: 'Update Instance', book_list: results.book_list, bookinstance: bookInstance});
                return;
            });
        } else{
            BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, (err, thebookinstance) => {
                if(err) { return next(err); }
                res.redirect(thebookinstance.url);
            });
        }
    }
];