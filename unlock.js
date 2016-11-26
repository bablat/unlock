const path = require('path')
const exphbs = require('express-handlebars')

var fs = require('fs')
var push = require('pushover-notifications')
var sys = require('util')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var config = require('config');
var exec = require('child_process').exec

app.use(express.static('public'))
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies

var retries = 1

// Read Configuration

// Setup Handlebar Views
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

app.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
        reply.view('login')
    }
})

// Process main GET request
app.get('/', (request, response) => {
    //console.log("retries = ", retries)
    if (retries == 1) {
        response.render('login', {
            title: "Enter Passphrase"
        })
    } else {
        response.render('login', {
            title: "Incorrect Passphrase, attempts: " + (retries - 1)
        })
    }
})

// Process SUCCESS request
app.get('/success', (request, response) => {
    var cmd = config.get("cmd_success")

    var output
    //console.log("retries should be 0, but they're = ", retries)
    if (retries == 0) {
        exec(cmd, function callback(error, stdout, stderr) {
            //console.log("out:", stdout, "err:", stderr)
            output = "Mounted: " + mounted() + "\n\n" + stdout + stderr
            //console.log("output is now: " + output)
            retries += 1
            pushthis(output, "Offsite: Success Page")
            response.render('success', {
                output: output
            })
        })
    } else {
        response.redirect('/')
    }
})

//Process form POST
app.post('/exec', function(req, res) {

    debugger;

    var p = req.body.passphrase
    var cmd_open
    var cmd_mount

    if (mounted()) {
        cmd_open = config.get("cmd_dryopen").replace("PASSPHRASE", p)
        cmd_mount = config.get("cmd_drymount")
    }
    else {
        cmd_open = config.get("cmd_open").replace("PASSPHRASE", p)
        cmd_mount = config.get("cmd_mount")
    }

    //console.log("before exec")
    exec(cmd_open, function callback(error, stdout, stderr) {
        if (!error) {
            exec(cmd_mount, function callback(error, stdout, stderr) {
                //console.log("executing: [" + cmd2 + "]")
                retries = 0
                pushthis("Success!", "Offsite: Password Accepted")
                //console.log("redirecting to success page")
                res.redirect("/success")
            })
        } else {
            retries += 1
            pushthis("Failure!", "Offsite: Incorrect Password")
            res.redirect("/")
        }

    })

})


// Notify restart
pushthis("Offsite: Starting")

// Bind to interface
app.listen(config.get("port"), config.get("interface"))

// Push to Pushover
function pushthis(message, title) {
    var p = new push({
        user: config.get("pushover-user"),
        token: config.get("pushover-token"),
        // onerror: function(error) {},
        // update_sounds: true // update the list of sounds every day - will
        // prevent app from exiting.
    })

    var msg = {
        // These values correspond to the parameters detailed on https://pushover.net/api
        // 'message' is required. All other values are optional.
        message: message, // required
        title: title,
        sound: 'magic',
        device: 'Offsite',
        priority: 1
    }

    p.send(msg, function(err, result) {
        if (err) {
            throw err
        }

        //console.log(result)

    })

}

// Test if secure is mounted
function mounted() {
    try {
        return fs.statSync('/secure/mounted').isFile()
    } catch (err) {
        return false
    }
}
