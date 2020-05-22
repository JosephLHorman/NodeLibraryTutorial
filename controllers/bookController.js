const async = require('async');
const {body, validationResult } = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

module.exports = {
    index: (req, res) => {  
        async.parallel({
            book_count: (callback) => Book.countDocuments({}, callback), // Pass an empty object as match condition to find all documents of this collection
            book_instance_count: (callback) => BookInstance.countDocuments({}, callback),
            book_instance_available_count: (callback) => BookInstance.countDocuments({status:'Available'}, callback),
            author_count: (callback) => Author.countDocuments({}, callback),
            genre_count: (callback) => Genre.countDocuments({}, callback)
        }, (err, results) => {
            res.render('index', { title: 'Local Library Home', error: err, data: results });
        });
    },

    // Display list of all Books.
    book_list: (req, res, next) => {
        Book.find({}, 'title author')
            .populate('author')
            .exec((err, list_books) => {
                if (err) { return next(err); }
                //Successful, so render
                res.render('book_list', { title: 'Book List', book_list: list_books });
        });
    },

    book_detail: (req, res, next) => {
        async.parallel({
            book: (callback) => {
                Book.findById(req.params.id)
                    .populate('author')
                    .populate('genre')
                    .exec(callback);
            },
            book_instance: (callback) => {
                BookInstance.find({ 'book': req.params.id })
                    .exec(callback);
            },
        }, (err, results) => {
            if (err) { return next(err); }
            if (results.book == null) { // No results.
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
        });
    },

    book_create_get: (req, res) => {
        //Get all authors and genres for use in creating a book
        async.parallel({
            authors: (callback) => Author.find(callback),
            genres: (callback) => Genre.find(callback)
        }, (err, results) => {
            if(err) {return next(err);}
            res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres});
        });
    },
    book_create_post: [
        //conv genre to array
        (req, res, next) => {
            if(!(req.body.genre instanceof Array)){
                if(typeof req.body.genre === 'undefined')
                    req.body.genre=[];
                else
                    req.body.genre = new Array(req.body.genre);
            }
            next();
        },

        //Validation
        body('title', 'Title must not be empty.').trim().isLength({min: 1}),
        body('author', 'Author must not be empty').trim().isLength({min: 1}),
        body('summary', 'Summary must not be empty').trim().isLength({min: 1}),
        body('isbn', 'ISBN must not be empty.').trim().isLength({min: 1}),

        //Sanitation
        sanitizeBody('*').escape(),

        //Process
        (req, res, next) => {
            const errors = validationResult(req);

            var book = new Book({
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            });

            if(!errors.isEmpty()){
                //Get authors and genres to send back to the form for re-submission
                async.parallel({
                    authors: (callback) => Author.find(callback),
                    genres: (callback) => Genre.find(callback)
                }, (err, results) => {
                    if(err) {return next(err);}

                    //Mark the appropriate genres as selected in return form
                    for(let i = 0; i < results.genres.length; i++){
                        if(book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genre[i].checked = 'true';
                        }
                    }
                    res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres, 
                        book: book, errors: errors.array() });
                });
            } else {
                book.save((err) => {
                    if(err) {return next(err); }

                    res.redirect(book.url);
                });
            }
        }
    ],

    book_delete_get: (req, res, next) => {
        async.parallel({
            book: (callback) => Book.findById(req.params.id).exec(callback),
            bookinstances: (callback) => BookInstance.find({'book': req.params.id}).exec(callback)
        }, (err, results) => {
            if(err) {return next(err);}
            if(results.book == null) {
                res.redirect('/catalog/books');
            }

            res.render('book_delete', {title: "Delete Book", book: results.book, bookinstances: results.bookinstances});
        });
    },
    book_delete_post: (req, res) => res.send("NOT IMPLEMENTED: Book delete POST"),

    book_update_get: (req, res, next) => {
        //Get the book, authors and genres associated
        async.parallel({
            book: (callback) => Book.findById(req.params.id).populate('author').populate('genre').exec(callback),
            authors: (callback) => Author.find(callback),
            genres: (callback) => Genre.find(callback)
        }, (err, results) => {
            if(err) {return next(err);}
            if(results.book == null) {
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }

            //Success
            //Mark already selected genres
            for(var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for(var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++){
                    if(results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked = 'true';
                    }
                }
            }

            res.render('book_form', {
                title: 'Update Book',
                authors: results.authors,
                genres: results.genres,
                book: results.book
            });
        });
    },
    book_update_post: [
        //Convert genres to array
        (req, res, next) => {
            if(!(req.body.genre instanceof Array)) {
                if(typeof req.body.genre === 'undefined')
                    req.body.genre=[];
                else
                    req.body.genre = new Array(req.body.genre);
            }
            next();
        },

        //Validation
        body('title', 'Title must not be empty').trim().isLength({min: 1}),
        body('author', 'Body must not be empty').trim().isLength({min: 1}),
        body('summary', 'Summary must not be empty').trim().isLength({min: 1}),
        body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}),

        //Sanitation
        sanitizeBody('title').escape(),
        sanitizeBody('author').escape(),
        sanitizeBody('summary').escape(),
        sanitizeBody('isbn').escape(),
        sanitizeBody('genre.*').escape(),

        //Process request
        (req, res, next) => {
            const errors = validationResult(req);

            var book = new Book( {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id:req.params.id //This is used to not assign a new id or duplicate
            });

            if(!errors.isEmpty()) {
                //Get all items for rendering form
                async.parallel({
                    authors: (callback) => Author.find(callback),
                    genres: (callback) => Genre.find(callback)
                }, (err, results) => {
                    if(err) {return next(err); }

                    //Mark selected genres as checked
                    for(let i = 0; i < results.genres.legnth; i++) {
                        if(book.genre.indexOf(results.genre[i]._id > -1)) {
                            results.genres[i].checked = 'true';
                        }
                    }

                    res.render('book_form', {
                        title: 'Update Book', 
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array()
                    });
                });
                return;
            } else {
                Book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
                    if(err) {return next(err); }

                    res.redirect(thebook.url);
                })
            }
        }
    ],
}
