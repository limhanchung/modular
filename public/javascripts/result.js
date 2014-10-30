
function qualifyURL(url){
  var img = document.createElement('img');
  img.src = url; // set string url
  url = img.src; // get qualified url
  img.src = null; // no server request
  return url;
}


oasis.connect('modular').then(function(port) {
  
  port.send('connected', {});
  
  port.on('data', function(data) {
    console.log(data);
    $('#r').append($('<li>' + data.payload  +'</li>'));
    
    var data = {
      target: qualifyURL('/static/result.html'),
      payload: $('#q').val(),
    };
  });
});

