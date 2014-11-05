var sandBoxes = {};

function createSandbox(z, shortcut) {
  if(typeof z !== 'string' || z == '') {
    return;
  }

  var r = qualifyURL(z);

  if( r in sandBoxes) {
    return false;
  }

  var sandbox = oasis.createSandbox({
    url: r,
    type: 'html',
    capabilities: [ 'modular' ],
    sandbox: {
      forms: true,
      scripts: true,
    }
  });

  sandbox.connect('modular').then(function(port) {
    port.on('connected', function(data) {
      sandbox.connected = true;
    });

    port.on('data', function(data) {
      data.origin = r;
      
      // Not necessary
      if('payload' in data) {
	data.payloadType = typeof data.payload;	    
      };
      
      if( Object.prototype.toString.call( data.target ) === '[object Array]' ) {
	data.targetType = 'array';
      };

      var timer = 1000;
      // Iterate through all sandboxes
      if( data.targetType == 'array' ) {
	for(var i = 0; i < data.target.length; i++) {	  
	  if( !(data.target[i] in sandBoxes)) {
	    createSandbox(data.target[i]);
	    setTimeout( function() { 
	      sandBoxes[data.target[i]].connect('modular').then(function(port2) {	   
		port2.send('data', data);	   
	      });
	    }, timer);
	  }  else  {
	    sandBoxes[data.target[i]].connect('modular').then(function(port2) {	   
	      port2.send('data', data);	   
	    });
	  }
	}
      } else {
	if( !(data.target in sandBoxes)) {

	  createSandbox(data.target);
	}
	if( sandBoxes[data.target].connected == true ) {
	  sandBoxes[data.target].connect('modular').then(function(port2) {
	    port2.send('data', data);
	  });	
	} else {
	  if( typeof sandBoxes[data.target].q === 'undefined' ) {
	    sandBoxes[data.target].q = [];
	  }
	  sandBoxes[data.target].q.push({type:'data', data: data});
	  var intervalFunction = function() { 
	    if ( !(data.target in sandBoxes)) {
	      return false;
	    }
	    if ( sandBoxes[data.target].connected == true ) {
	      sandBoxes[data.target].connect('modular').then(function(port2) {
		while(sandBoxes[data.target].q.length) {
		  var d = sandBoxes[data.target].q.shift();
		  console.log(d);
		  port2.send(d.type,d.data );
		}
	      });
	      return true;
	    } else {
	      sandBoxes[data.target].msgTimer = setTimeout(intervalFunction, timer);
	      return false;
	    }
	  };
	  
	  if( typeof sandBoxes[data.target].msgTimer === 'undefined' ) {
	    intervalFunction();
	  };
	}
      }
    });
  });

  var appContainer = $('<div class="card-app-outer pure-u-lg-1-3 pure-u-1"></div>');
  var appInnerContainer = $('<div class="card-app"></div>');

  var listItem;
  var name;
  if(typeof shortcut === 'string' && shortcut != '' ) {
    name = shortcut.replace(' ', '_');
    listItem = $('<li id="card-app-shorcut-link"><a href="#' + name + '" title="' + shortcut  +'">' + shortcut + '</a></li>');
    appContainer.attr('name', name);
    appContainer.attr('id', name);
    $('#card-app-ul').append(listItem);
  } else {
    var today = new Date();
    var seed = today.getSeconds();
    var random = Math.floor(Math.random(seed) * 10000000);
    name = random;    
    var display = r;
    if( r.length > 33 ) {
      display = r.substring(0,15);
      display += "...";
      display += r.slice(-15);
    }

    listItem = $('<li class="card-app-shortcut-link"><a href="#' + name + '" title="' + r  + '">' + display + '</a></li>');
    appContainer.attr('name', name);
    appContainer.attr('id', name);
    $('#card-app-ul').append(listItem);
  }

  var closeButton = $('<a class="remove" href="#">x</a>').on('click touchstart', function (e) {
    $(this).parent().parent().remove();
    sandbox.terminate();
    if (listItem) {
      listItem.remove();
    }
    delete sandBoxes[r];
  });

  $('#card-app-store').append(appContainer.append(appInnerContainer.append(sandbox.el).append(closeButton)));
  sandBoxes[r] = sandbox;

  $('html,body').animate({
    scrollTop: $('#' + name).offset().top},
			 'slow');

  return sandbox;
}

var gridster;

var cardAppAddClose = function() {
  $('#card-app-overlay').hide();
  $('#card-app-add').hide();
};

$(document).ready(function() {
  $('#card-app-add-modal-button').on('click touchstart', function (e) {
    $('#card-app-overlay').show();
    $('#card-app-add').show();
    $('#card-app-add-url').focus();
  });
  
  $('#card-app-add-modal-url').submit( function(e) {
    var cardName = $("[name='cardAppName']").val();
    var cardUrl = $("[name='cardAppUrl']").val();
    createSandbox(cardUrl, cardName);
    return false;
  });

  $('.card-app-cancel-button').on('click touchstart', function(e) {
    cardAppAddClose();
  });

  $(document).keyup(function(e) {
    if (e.keyCode == 27) { 
      cardAppAddClose();
    }  
  });


  $('.card-app-shortcut-link').on('click touchstart', function(e) {
    var self = this;
    $('html,body').animate({
      scrollTop: $('#' + $(self).attr('href')).offset().top},
			   'slow');
    
  });


  createSandbox('/static/index.html');
});
