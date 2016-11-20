const path = require('path')
const exphbs = require('express-handlebars')


var express = require('express'),
    bodyParser = require('body-parser'),
    form = require('express-form'),
    field = form.field;
 
var app = express();
app.use(bodyParser());

app.engine('.hbs', exphbs({  
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')  
app.set('views', path.join(__dirname, 'views'))  

app.get('/', (request, response) => {  
  response.render('home', {
    name: 'John'
  })
})
 
/*
app.post(
 
  // Route 
  '/user',
 
  // Form filter and validation middleware 
  form(
    field("username").trim().required().is(/^[a-z]+$/),
    field("password").trim().required().is(/^[0-9]+$/),
    field("email").trim().isEmail()
   ),
 
   // Express request-handler now receives filtered and validated data 
   function(req, res){
     if (!req.form.isValid) {
       // Handle errors 
       console.log(req.form.errors);
 
     } else {
       // Or, use filtered form data from the form object: 
       console.log("Username:", req.form.username);
       console.log("Password:", req.form.password);
       console.log("Email:", req.form.email);
     }
  }
);
*/

app.listen(3000);

