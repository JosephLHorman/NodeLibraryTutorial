const BookInstance = require('../models/bookinstance');

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

    bookinstance_create_get: (req, res) => res.send("NOT IMPLEMENTED: BookInstance create GET"),
    bookinstance_create_post: (req, res) => res.send("NOT IMPLEMENTED: BookInstance create POST"),
    bookinstance_delete_get: (req, res) => res.send("NOT IMPLEMENTED: BookInstance delete GET"),
    bookinstance_delete_post: (req, res) => res.send("NOT IMPLEMENTED: BookInstance delete POST"),
    bookinstance_update_get: (req, res) => res.send("NOT IMPLEMENTED: BookInstance update GET"),
    bookinstance_update_post: (req, res) => res.send("NOT IMPLEMENTED: BookInstance update POST")
}
