var User = require('../models/userModel');
var bcrypt = require('bcrypt');

var jwt = require('jsonwebtoken');
var _ = require('lodash');

var createToken = function(user) {
  return jwt.sign(_.omit(user, 'password'), 'config.secret', { expiresIn: 60 * 60 * 5 });
};

// Error messages to log and return as responses
var errNoUsername = 'Username does not exist'; 
var errIncorrectPassword = 'Incorrect password';
var errUsernameTaken = 'Username already taken';

var hashPassword = function(pw, callback) {
  bcrypt.genSalt(4, function(err, salt) {
    bcrypt.hash(pw, salt, function(err, hash) {
      if (err) {
        console.error(err);
        return;
      }
      callback(hash);
    });
  });
};

var comparePassword = function(pw, hash, callback) {
  bcrypt.compare(pw, hash, function(err, match) {
    if (err) {
      console.error(err);
      return;
    }
    callback(match);
  });
};

exports.login = function(req, res) {
  console.log('POST /api/users/login. username:', req.body.username);
  User.findOne({username: req.body.username})
    .then(function(user) {
      if (!user) {
        console.log(errNoUsername);
        res.status(401).send();
      }
      comparePassword(req.body.password, user.password, function(match) {
        if (!match) {
          console.log(errIncorrectPassword);
          res.status(401).send();
        } else {
          res.status(201).send({
            'id_token': createToken(user)
          });
        }
      });
    });
};

exports.signup = function(req, res) {
  console.log('POST /api/users/signup. username:', req.body.username);
  User.findOne({username: req.body.username})
    .then(function(user) {
      if (!user) {
        hashPassword(req.body.password, function(hashedPassword) {
          User.create({
            username: req.body.username,
            password: hashedPassword
          }).then(function(user) {
            res.status(201).send({
              'id_token': createToken(user)
            });
          });
        });
      } else {
        console.log(errUsernameTaken);
        res.status(401).send();
      }
    });
};