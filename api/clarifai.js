var requestPromise = require('request-promise');

module.exports = function(pubUrl) {
  var clarifaiToken = 'arjpz8bfkwCnnMQss5p5hS3SNb0wsE';
  return requestPromise({
    uri: 'https://api.clarifai.com/v1/tag/?url=' + pubUrl, 
    method: 'GET',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + clarifaiToken
    }
  }).then(function(res) {
    return res.results[0].result.tag;
  }).catch(function(err) {
    console.log('error requresting from clarifai', err);
  });
};