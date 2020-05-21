const async = require('async');

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

    author_create_get: (req, res) => res.send("NOT IMPLEMENTED: Author create GET"),
    author_create_post: (req, res) => res.send("NOT IMPLEMENTED: Author create POST"),
    author_delete_get: (req, res) => res.send("NOT IMPLEMENTED: Author delete GET"),
    author_delete_post: (req, res) => res.send("NOT IMPLEMENTED: Author delete POST"),
    author_update_get: (req, res) => res.send("NOT IMPLEMENTED: Author update GET"),
    author_update_post: (req, res) => res.send("NOT IMPLEMENTED: Author update POST")
}
