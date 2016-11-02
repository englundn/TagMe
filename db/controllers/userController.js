var User = require('../models/userModel');

var jwt = require('jsonwebtoken');
var _ = require('lodash');

var createToken = function(user) {
  return jwt.sign(_.omit(user, 'password'), 'config.secret', { expiresIn: 60 * 60 * 5 });
};

// Error messages to log and return as responses
var errNoUsername = 'Username does not exist'; 
var errIncorrectPassword = 'Incorrect password';
var errUsernameTaken = 'Username already taken';

exports.login = function(req, res) {
  console.log('POST /api/users/login. username:', req.body.username);
  User.findOne({username: req.body.username})
    .then(function(user) {
      if (!user) {
        console.log(errNoUsername);
        res.status(401).send();
      } else if (user.password !== req.body.password) {
        console.log(errIncorrectPassword);
        res.status(401).send();
      }

      if (req.body.deviceId !== null) {
        User.findOne({deviceId: req.body.deviceId})
          .then(function(user2) {
            if (user2) {
              user2.deviceId = null;
            }
            user.deviceId = req.body.deviceId;
            user.save(function() {
              res.status(201).send({
                'id_token': createToken(user)
              });
            })
          })
      } else {
        res.status(201).send({
          'id_token': createToken(user)
        });
      }
    });
};

exports.signup = function(req, res) {
  console.log('POST /api/users/signup. username:', req.body.username);
  User.findOne({username: req.body.username})
    .then(function(user) {
      if (!user) {
        User.create({
          username: req.body.username,
          password: req.body.password,
          deviceId: req.body.deviceId
        }).then(function(user) {
          res.status(201).send({
            'id_token': createToken(user)
          });
        });
      } else {
        console.log(errUsernameTaken);
        res.status(401).send();
      }
    });
};

exports.saved = function(req, res) {
  console.log('POST /api/users/saved');
  User.findOne({deviceId: req.body.deviceId})
    .then(function(user) {
      if (!user) {
        console.log(errNoUsername);
        res.status(401).send();
      } else {
        res.status(201).send({
          'id_token': createToken(user),
          'username': user.username
        });
      }
    })
};

exports.logout = function(req, res) {
  console.log('POST /api/users/logout')
  if (req.body.deviceId !== null) {
    User.findOne({deviceId: req.body.deviceId})
      .then(function(user) {
        if (!user) {
          res.status(201).send();
        } else {
          user.deviceId = null;
          user.save(function(err) {
            res.status(201).send();
          })
        }
      })
  } else {
    res.status(201).send();
  }
};
