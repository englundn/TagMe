var mongoose = require('mongoose');

mongoose.connect('mongodb://admin:admin@ds061248.mlab.com:61248/heroku_j8ggxq7z');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function() {
  console.log('db is open!');
});


module.exports = mongoose;