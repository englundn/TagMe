var requestPromise = require('request-promise');

module.exports = function(pubUrl) {
  var clarifaiToken = 'vyi64JHGfZnXr7KsRQQmiaVKmANDPu';
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

module.exports('https://s3-us-west-1.amazonaws.com/indecipherablesuggestions/images/6a9d969d-384a-401f-b072-abb810f19310.jpg');
