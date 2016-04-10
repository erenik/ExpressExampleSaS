var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var jsonfile = require('jsonfile');
var file = 'database.json';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));


function getPosts()
{
	var json = [["Emil", "Chair", 2, 10, "A very nice chair"], ["Nhi", "LOAS-sized mattress", 1, 15, "Hi! I need a LOAS-sized mattress for the new apartment I am moving to!"]];
	//{["Emil", "Chair", 2, 10, "A very nice chair\"], [\"Nhi\", \"LOAS-sized mattress\", 1, 15, \"Hi! I need a LOAS-sized mattress for the new apartment I am moving to!"]}
    return json;
}


// Default format. 1 for buy, 2 for sell, 3 for aution.
// [offererName, nameOfObject, buyOrSellOrAuction1-3, priceDesiredOrStarting, shortDescription]

/// Our site-parts.
/// Index, display some offers?
app.get('/', function(req, res){
	var renderResult = res.render('index', 
			{
				title: 'Home',
			//	languages: 'lall'
				posts: getPosts()
			}
		);
	console.log(renderResult);
	
});

// input data form
app.get('/input', function(req, res) {
    res.render('test', {title: 'Add item'});
});


// get data from form (may be store into an XML file)
app.post('/result', function(req, res) {
    jsonfile.writeFile(file, req.body, function (err) {
        console.error(err)
    });
    res.send(req.body);
}); 

/// Service if others want to integrate offers elsewhere?
app.get('/alldata', function(req, response)
{
   response.writeHead(200, {'Content-Type': 'text/plain'});   
   // Send the response body as "Hello World"
   response.end(JSON.stringify(getPosts()));
//	document.close();
});

/// Just some info.
app.get('/about', function(req, res){
  res.render('about', {
    title: 'About'
  });
});
/// Contact info?
app.get('/contact', function(req, res){
  res.render('contact', {
    title: 'Contact'
  });
});

// app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
