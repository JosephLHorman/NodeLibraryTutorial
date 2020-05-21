const async = require('async');

const Genre = require('../models/genre');
const Book = require('../models/book');


module.exports = {
    // Display list of all Genre.
    genre_list: (req, res, next) => {
        Genre.find()
          .sort([['name', 'ascending']])
          .exec(function (err, list_genres) {
            if (err) { return next(err); }
            
            res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
          });
    },

    // Display detail page for a specific Genre.
    genre_detail: (req, res, next) => {
        async.parallel({
            genre: function(callback) {
                Genre.findById(req.params.id)
                .exec(callback);
            },
            genre_books: function(callback) {
                Book.find({'genre': req.params.id})
                .exec(callback);
            }
        }, function(err, results) {
            if(err) {return next(err); }

            if(results.genre == null) {
                var err = new Error("Genre not found");
                err.status = 404;
                return next(err);
            }
            
            res.render('genre_detail', {title: 'Genre detail', genre: results.genre, genre_books: results.genre_books})
        });
    },

    genre_create_get: (req, res) => res.send("NOT IMPLEMENTED: Genre create GET"),
    genre_create_post: (req, res) => res.send("NOT IMPLEMENTED: Genre create POST"),
    genre_update_get: (req, res) => res.send("NOT IMPLEMENTED: Genre delete GET"),
    genre_update_post: (req, res) => res.send("NOT IMPLEMENTED: Genre delete POST"),
    genre_delete_get: (req, res) => res.send("NOT IMPLEMENTED: Genre update GET"),
    genre_delete_post: (req, res) => res.send("NOT IMPLEMENTED: Genre update POST"),
}
