const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

module.exports = {
    // Display list of all BookInstances.
    bookinstance_list: (req, res, next) => {
        BookInstance.find()
            .populate('book')
            .exec( (err, list_bookinstances) => {
                if (err) { return next(err); }
                
                res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances});
            });
    },

    // Display detail page for a specific BookInstance.
    bookinstance_detail: (req, res, next) => {
        BookInstance.findById(req.params.id)
            .populate('book')
            .exec((err, bookinstance) => {
                if (err) { return next(err); }
                if (bookinstance == null) { // No results.
                    var err = new Error('Book copy not found');
                    err.status = 404;
                    return next(err);
                    }
                // Successful, so render.
                res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance
            });
        })
    },

    bookinstance_create_get: (req, res, next) => {
        //Populate book options for instance create form
        Book.find({}, 'title')
            .exec((err, books) => {
                if(err) {return next(err);}

                res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
            });
    },
    bookinstance_create_post: [
        //Validation
        body('book', 'book must be specified').trim().isLength({min: 1}),
        body('imprint', 'Imprint must be specified').trim().isLength({min: 1}),
        body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

        //Sanitation
        sanitizeBody('book').escape(),
        sanitizeBody('imprint').escape(),
        sanitizeBody('status').escape(),
        sanitizeBody('due_back').toDate(),

        //Process req
        (req, res, next) => {
            const errors = validationResult(req);

            var bookinstance = new BookInstance({ 
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            });

            if(!errors.isEmpty()) {
                //Populate book options for instance create form
                Book.find({}, 'title')
                    .exec((err, books) => {
                        if(err) {return next(err);}

                        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, 
                            selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
                    });
                return;
            } else {
                bookinstance.save((err) => {
                    if(err) {return next(err);}

                    res.redirect(bookinstance.url);
                });
            }
        }
    ],
    bookinstance_delete_get: (req, res) => res.send("NOT IMPLEMENTED: BookInstance delete GET"),
    bookinstance_delete_post: (req, res) => res.send("NOT IMPLEMENTED: BookInstance delete POST"),
    bookinstance_update_get: (req, res) => res.send("NOT IMPLEMENTED: BookInstance update GET"),
    bookinstance_update_post: (req, res) => res.send("NOT IMPLEMENTED: BookInstance update POST")
}
