const async = require('async');

const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

module.exports = {
    index: (req, res) => {  
        async.parallel({
            book_count: function(callback) {
                Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
            },
            book_instance_count: function(callback) {
                BookInstance.countDocuments({}, callback);
            },
            book_instance_available_count: function(callback) {
                BookInstance.countDocuments({status:'Available'}, callback);
            },
            author_count: function(callback) {
                Author.countDocuments({}, callback);
            },
            genre_count: function(callback) {
                Genre.countDocuments({}, callback);
            }
        }, function(err, results) {
            res.render('index', { title: 'Local Library Home', error: err, data: results });
        });
    },

    // Display list of all Books.
    book_list: (req, res, next) => {
        Book.find({}, 'title author')
          .populate('author')
          .exec(function (err, list_books) {
            if (err) { return next(err); }
            //Successful, so render
            res.render('book_list', { title: 'Book List', book_list: list_books });
          });
      },

      book_detail: (req, res, next) => {
        async.parallel({
            book: function(callback) {
                Book.findById(req.params.id)
                  .populate('author')
                  .populate('genre')
                  .exec(callback);
            },
            book_instance: function(callback) {
              BookInstance.find({ 'book': req.params.id })
              .exec(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so render.
            res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
        });
    },

    book_create_get: (req, res) => res.send("NOT IMPLEMENTED: Book create GET"),
    book_create_post: (req, res) => res.send("NOT IMPLEMENTED: Book create POST"),
    book_delete_get: (req, res) => res.send("NOT IMPLEMENTED: Book delete GET"),
    book_delete_post: (req, res) => res.send("NOT IMPLEMENTED: Book delete POST"),
    book_update_get: (req, res) => res.send("NOT IMPLEMENTED: Book update GET"),
    book_update_post: (req, res) => res.send("NOT IMPLEMENTED: Book update POST"),
}
