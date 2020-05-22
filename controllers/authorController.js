const async = require('async');
const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

const Author = require('../models/author');
const Book = require('../models/book');


module.exports = {
    // Display list of all Authors.
    author_list: (req, res, next) => {
        Author.find()
            .populate('author')
            .sort([['family_name', 'ascending']])
            .exec((err, list_authors) => {
                if (err) { return next(err); }
                
                res.render('author_list', { title: 'Author List', author_list: list_authors });
            });
    },

    // Display detail page for a specific Author.
    author_detail: (req, res, next) => {
        async.parallel({
            author: (callback) => {
                Author.findById(req.params.id)
                .exec(callback)
            },
            authors_books: (callback) => {
            Book.find({ 'author': req.params.id },'title summary')
            .exec(callback)
            },
        }, (err, results) => {
            if (err) { return next(err); } // Error in API usage.
            if (results.author == null) { // No results.
                var err = new Error('Author not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
        });
    },

    author_create_get: (req, res) => res.render('author_form', {title: 'Create Author'}),
    author_create_post: [
        //validation
        body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified')
            .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
        body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified')
            .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
        body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601(),
        body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601(),

        //Sanitation
        sanitizeBody('first_name').escape(),
        sanitizeBody('family_name').escape(),
        sanitizeBody('date_of_birth').toDate(),
        sanitizeBody('date_of_death').toDate(),

        //Process
        (req, res, next) => {
            const errors = validationResult(req);

            if(!errors.isEmpty()) {
                res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array() });
                return;
            } else {
                let author = new Author(
                    {
                        first_name: req.body.first_name,
                        family_name: req.body.family_name,
                        date_of_birth: req.body.date_of_birth,
                        date_of_death: req.body.date_of_death
                    });
                author.save((err) => {
                    if(err) {return next(err);}

                    res.redirect(author.url);
                });
            }
        }
    ],
    author_delete_get: (req, res, next) => {
        async.parallel({
            author: (callback) => Author.findById(req.params.id).exec(callback),
            authors_books: (callback) => Book.find({'author': req.params.id }).exec(callback)
        }, (err, results) => {
            if(err) {return next(err);}
            if(results.author == null) {
                res.redirect('/catalog/authors');
            }

            res.render('author_delete', {title: "Delete Author", author: results.author, author_books: results.authors_books});
        });
    },
    author_delete_post: (req, res, next) => {
        async.parallel({
            author: (callback) => Author.findById(req.body.authorid).exec(callback),
            authors_books: (callback) => Book.find({'author': req.body.authorid}).exec(callback)
        }, (err, results)  => {
            if(err) {return next(err);}

            if(results.authors_books.length > 0) {
                //Author has books, render same as get method
                res.render('author_delete', {title: "Delete Author", author: results.author, author_books: results.authors_books});
                return;
            } else {
                //no books, remove author and return to author list
                Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                    if(err) {return next(err);}
                    
                    res.redirect('/catalog/authors');
                });
            }
        });
    },
    author_update_get: (req, res) => res.send("NOT IMPLEMENTED: Author update GET"),
    author_update_post: (req, res) => res.send("NOT IMPLEMENTED: Author update POST")
}
