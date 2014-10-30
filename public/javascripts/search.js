$(document).ready( function() {

  oasis.connect('modular').then(function(port) {
    function qualifyURL(url){
      var img = document.createElement('img');
      img.src = url; // set string url
      url = img.src; // get qualified url
      img.src = null; // no server request
      return url;
    }

    $('#s').click(function(e) {

      var data = {
	target: qualifyURL('/static/result.html'),
	payload: $('#q').val(),
      };    
      port.send('data', data );

      var action = {
	target: [ '_self', qualifyURL('/static/search.html') ],
	'class' : 'pure-u-1 pure-u-md-1-4',
	'height' : document.body.scrollHeight + 'px',
	'width' : '100%',
      };    
//      port.send('action', action );

      e.preventDefault();
      return false;
    });

    
    $('#a').click(function(e) {
      var data = {
	target: [ qualifyURL('/static/result.html'), qualifyURL('/static/search.html') ],
	payload: $('#q').val(),
      };    
      port.send('action', data );

      e.preventDefault();
      return false;
    });

    
    port.on('data', function(data) {
      // Do something
    });
  });
});
