var sandBoxes = {};

function createSandbox(z) {
  if(typeof z !== 'string' || z == '') {
    return;
  }

  var r = qualifyURL(z);

  var sandbox = oasis.createSandbox({
    url: r,
    type: 'html',
    capabilities: [ 'modular' ],
    sandbox: {
      forms: true
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
	    if ( sandBoxes[data.target].connected == true ) {
	      sandBoxes[data.target].connect('modular').then(function(port2) {
		while(sandBoxes[data.target].q.length) {
		  var d = sandBoxes[data.target].q.shift();
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
  

  $('#main').append(sandbox.el);
  sandBoxes[r] = sandbox;
  return sandbox;
}

var gridster;

$(document).ready(function() {
  createSandbox('/static/index.html');  
});


/*
    port.on('action', function(data) {
      console.log(data);
      data.origin = r;
      
      // Not necessary
      if('payload' in data) {
	data.payloadType = typeof data.payload;	    
      };
      
      if( Object.prototype.toString.call( data.target ) === '[object Array]' ) {
	data.targetType = 'array';
      };

      if( data.targetType == 'array' ) {
	for(var i = 0; i < data.target.length; i++) {
	  if( data.target[i] == '_self' ) {
	    data.target[i] = data.origin;
	  }
	  if( 'class' in data ) {
	    sandBoxes[data.target[i]].el.className = data['class'];
	  }
	  if( 'height' in data ) {
	    sandBoxes[data.target[i]].el.style.height =  data.height;
	  }
	  if( 'width' in data ) {
	    sandBoxes[data.target[i]].el.style.width = data.width;
	  }
	}
      } else {
	if( data.target[i] == '_self' ) {
	  data.target = data.origin;
	}
	if( data.method == 'class' ) {
	  sandBoxes[data.target].el.className= data.value;
	}
      }		
      

    });
*/
