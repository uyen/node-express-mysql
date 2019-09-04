const fs = require('fs');
var async = require("async");
var credentials = {connectionLimit: 10, host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'} ;



/*
async.parallel([
  function(callback) { db.query(QUERY1, callback) },
  function(callback) { db.query(QUERY2, callback) }
], function(err, results) {
  res.render('template', { rows : results[0], rows2 : results[1] });
});
*/

module.exports = {
    addPlayerPage: (req, res) => {
        let stateQ = "SELECT * FROM `states` order by name";
        db.query(stateQ, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.render('add-outlet.ejs', {
                title: "Welcome! Add a new outlet", message: '', states:result 
            });
        });

       
    },
    addPlayer: (req, res) => {
        if (!req.files) {
            return res.status(400).send("No files were uploaded.");
        }

        let message = '';
        let first_name = req.body.first_name;
        let last_name = req.body.last_name;
        let position = req.body.position;
        let number = req.body.number;
        let username = req.body.username;
        let uploadedFile = req.files.image;
        let image_name = uploadedFile.name;
        let fileExtension = uploadedFile.mimetype.split('/')[1];
        image_name = username + '.' + fileExtension;

        let usernameQuery = "SELECT * FROM `players` WHERE user_name = '" + username + "'";

        db.query(usernameQuery, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result.length > 0) {
                message = 'Username already exists';
                res.render('add-outlet.ejs', {
                    message,
                    title: "Welcome! Add a new outlet"
                });
            } else {
                // check the filetype before uploading it
                if (uploadedFile.mimetype === 'image/png' || uploadedFile.mimetype === 'image/jpeg' || uploadedFile.mimetype === 'image/gif') {
                    // upload the file to the /public/assets/img directory
                    uploadedFile.mv(`public/assets/img/${image_name}`, (err ) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        // send the player's details to the database
                        let query = "INSERT INTO `players` (first_name, last_name, position, number, image, user_name) VALUES ('" +
                            first_name + "', '" + last_name + "', '" + position + "', '" + number + "', '" + image_name + "', '" + username + "')";
                        db.query(query, (err, result) => {
                            if (err) {
                                return res.status(500).send(err);
                            }
                            res.redirect('/');
                        });
                    });
                } else {
                    message = "Invalid File format. Only 'gif', 'jpeg' and 'png' images are allowed.";
                    res.render('add-outlet.ejs', {
                        message,
                        title: "Welcome to Socka | Add a new player"
                    });
                }
            }
        });
    },
    editPlayerPage: (req, res) => {
        let playerId = req.params.id;
        const mysql = require('mysql');
        var pool = mysql.createPool(credentials);

        let query1 = "SELECT * FROM `players` WHERE id = '" + playerId + "' ";
        let query2 = "SELECT * FROM `states` order by name";

        var return_data = { title: 'Edit  Outlet', message: '' } ;

        async.parallel([
           function(parallel_done) {
               pool.query(query1, {}, function(err, results) {
                   if (err) {
                        return_data.player = [];
                   }
                   return_data.player = results[0];
                   parallel_done();
               });
           },
           function(parallel_done) {
               pool.query(query2, {}, function(err, results) {
                   if (err) {
                        return_data.state = [];
                   }
                   return_data.states = results;
                   parallel_done();
               });
           }
        ], function(err) {
            if (err) console.log(err); 

            pool.end(); 
            res.render('edit-outlet.ejs', return_data  );
        });


    },
    editPlayer: (req, res) => {
        let playerId = req.params.id;
        let first_name = req.body.first_name;
        let last_name = req.body.last_name;
        let position = req.body.position;
        let number = req.body.number;

        let query = "UPDATE `players` SET `first_name` = '" + first_name + "', `last_name` = '" + last_name + "', `position` = '" + position + "', `number` = '" + number + "' WHERE `players`.`id` = '" + playerId + "'";
        db.query(query, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.redirect('/');
        });
    },
    deletePlayer: (req, res) => {
        let playerId = req.params.id;
        let getImageQuery = 'SELECT image from `players` WHERE id = "' + playerId + '"';
        let deleteUserQuery = 'DELETE FROM players WHERE id = "' + playerId + '"';

        db.query(getImageQuery, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }

            let image = result[0].image;

            fs.unlink(`public/assets/img/${image}`, (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                db.query(deleteUserQuery, (err, result) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.redirect('/');
                });
            });
        });
    }
};
