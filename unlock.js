const path = require('path')
const exphbs = require('express-handlebars')

var fs = require('fs');
var push = require('pushover-notifications');
var sys = require('sys')
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(express.static('public'))

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var retries = 1;

app.engine('.hbs', exphbs({  
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')  
app.set('views', path.join(__dirname, 'views'))  

app.get('/', (request, response) => {
  console.log("retries = ", retries);
  if (retries == 1) {
    response.render('login', { title: "Enter Passphrase" });
  }
  else {
    response.render('login', { title: "Incorrect Passphrase, attempts: " + (retries-1)});
  }
})

app.get('/success', (request, response) => {
  var cmd = "sudo cryptsetup status securebackup ; echo ;  mount | grep securebackup ; echo ; fortune";
  var exec = require('child_process').exec;
  var output;
  console.log("retries should be 0, but they're = ", retries);
  if (retries == 0) {
    exec(cmd, function callback(error, stdout, stderr){
      console.log("out:", stdout, "err:", stderr);
      output = "Dry Run: " + mounted() + "\n\n" + stdout + stderr;
      console.log("output is now: " + output);
      retries += 1;
      pushthis(output, "Offsite: Success Page");
      response.render('success', { output: output });
    });
  }
  else {
    response.redirect('/');
  }
})

app.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply.view('login');
  }
});

 
app.post('/exec', function(req, res) {
    var p = req.body.passphrase

    var cmd = "echo -n \"" + p + "\" | sudo cryptsetup luksOpen /dev/sda1 securebackup --tries 1"
    cmd2 = "sudo mount /dev/mapper/securebackup /secure";
    if (mounted()) {
      cmd += " --test-passphrase";
      cmd2 = "sudo mount -f /dev/mapper/securebackup /secure";
    }

    console.log("before exec");
    var exec = require('child_process').exec;
    exec(cmd, function callback(error, stdout, stderr){
	if (!error) {
	  exec(cmd2, function callback(error, stdout, stderr){
	    console.log("executing: [" + cmd2 + "]");
	  });
	  retries = 0;
	  pushthis("Success!", "Offsite: Password Accepted");
	  console.log("redirecting to success page");
	  res.redirect("/success");
	}
	else {
	  retries += 1;
	  pushthis("Failure!", "Offsite: Incorrect Password");
	  res.redirect("/");
	}

    });

  }
);

app.listen(8080, '127.0.0.1');

function pushthis(message, title) {
  var p = new push( {
  user: 'ueKMP1A4NmqmNifmzQSQCJBbemgXdT',
  token: 'agk7apfdijtgo8us21r22xso7guary',
  // onerror: function(error) {}, 
  // update_sounds: true // update the list of sounds every day - will 
  // prevent app from exiting. 
});
 
var msg = {
    // These values correspond to the parameters detailed on https://pushover.net/api 
    // 'message' is required. All other values are optional. 
    message: message,	// required 
    title: title,
    sound: 'magic',
    device: 'Offsite',
    priority: 1
};
 
p.send( msg, function( err, result ) {
    if ( err ) {
        throw err;
    }
 
    console.log( result );

});

}

var fs = require('fs');

function mounted()
{
    try
    {
        return fs.statSync('/secure/mounted').isFile();
    }
    catch (err)
    {
        return false;
    }
}
