const async = require('async');
const validator = require('express-validator');

const Genre = require('../models/genre');
const Book = require('../models/book');


module.exports = {
    // Display list of all Genre.
    genre_list: (req, res, next) => {
        Genre.find()
          .sort([['name', 'ascending']])
          .exec((err, list_genres) => {
            if (err) { return next(err); }
            
            res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
          });
    },

    // Display detail page for a specific Genre.
    genre_detail: (req, res, next) => {
        async.parallel({
            genre: (callback) => {
                Genre.findById(req.params.id)
                .exec(callback);
            },
            genre_books: (callback) => {
                Book.find({'genre': req.params.id})
                .exec(callback);
            }
        }, (err, results) => {
            if(err) {return next(err); }

            if(results.genre == null) {
                var err = new Error("Genre not found");
                err.status = 404;
                return next(err);
            }
            
            res.render('genre_detail', {title: 'Genre detail', genre: results.genre, genre_books: results.genre_books})
        });
    },

    genre_create_get: (req, res, next) => res.render('genre_form', {title: "Create Genre"}),
    genre_create_post: [
        validator.body('name', 'Genre name required').trim().isLength({min: 1}),
        validator.sanitizeBody('name').escape(),

        (req, res, next) => {
            const errors = validator.validationResult(req);

            let genre = new Genre(
                {name: req.body.name}
            );

            if(!errors.isEmpty()) {
                res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
                return;
            } else {
                //check if already exists
                Genre.findOne({'name': req.body.name})
                    .exec((err, found_genre) => {
                        if(err) {return next(err);}

                        if(found_genre) {
                            //if exists redirect to matching details page
                            res.redirect(found_genre.url);
                        } else {
                            genre.save((err) => {
                                if(err) {return next(err);}

                                res.redirect(genre.url);
                            })
                        }
                    });
            }
        }
    ],
    genre_update_get: (req, res) => res.send("NOT IMPLEMENTED: Genre delete GET"),
    genre_update_post: (req, res) => res.send("NOT IMPLEMENTED: Genre delete POST"),
    genre_delete_get: (req, res) => res.send("NOT IMPLEMENTED: Genre update GET"),
    genre_delete_post: (req, res) => res.send("NOT IMPLEMENTED: Genre update POST"),
}
