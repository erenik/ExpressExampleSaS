var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var fs = require('fs');
var jsonfile = require('jsonfile');
var file = 'database.json';

var passport = require('passport'); // For login
// var facebookStrategy = require('passport-facebook').Strategy;

var app = express();

// Handle file upload
var multer	=	require('multer');
var fileName = "";
var storage	=	multer.diskStorage({
  destination: function (req, file, callback) {
	callback(null, './public/themes/images/products');
  },
  filename: function (req, file, callback) {
	  fileName = file.fieldname + '-' + Date.now();
	callback(null, fileName);
  }
});
var upload = multer({ storage : storage}).single('image');

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
	var JSONdata = [];
	var readingFile = true;
	/// Save new offer to file.
	JSONdata = jsonfile.readFileSync(file);
	//console.log("JSONdata: "+JSON.stringify(JSONdata));
	return JSONdata;
/*
	var json = [["Emil", "Chair", 2, 10, "A very nice chair"], ["Nhi", "LOAS-sized mattress", 1, 15, "Hi! I need a LOAS-sized mattress for the new apartment I am moving to!"]];
	//{["Emil", "Chair", 2, 10, "A very nice chair\"], [\"Nhi\", \"LOAS-sized mattress\", 1, 15, \"Hi! I need a LOAS-sized mattress for the new apartment I am moving to!"]}
	return json;
	*/
}

/*
passport.use(new FacebookStrategy({
		clientID: FACEBOOK_APP_ID,
		clientSecret: FACEBOOK_APP_SECRET,
		callbackURL: "localhost:3000/auth/facebook/callback"
	},
	function(accessToken, refreshToken, profile, done)
	{
		User.findOrCreate(..., function(err, user)
		{
			if (err){return done(err);}
			done(null,user);
		});
	}
));*/

// Search function
function doSearch(criteria) {
	var jsonData = getPosts();
	var searchResult = [];
	//console.log("\n\nCheck: "+JSON.stringify(criteria));
	for (var i = 0; i < jsonData.length; i++) {       
		if ((criteria.item == "" || criteria.item == jsonData[i].item) 
		&& (criteria.username == "" || criteria.username == jsonData[i].username)
		&& (criteria.startPrice == "" || criteria.startPrice < jsonData[i].price || criteria.startPrice == jsonData[i].price)
		&& (criteria.maxPrice == "" || criteria.maxPrice > jsonData[i].price || criteria.maxPrice == jsonData[i].price)
		&& (criteria.funcs == "" || criteria.funcs == jsonData[i].funcs)) 
		{
			searchResult = searchResult.concat(jsonData[i]);
		}        
	 }
	 return searchResult;
}


// Default format. 1 for buy, 2 for sell, 3 for aution.
// [offererName, nameOfObject, buyOrSellOrAuction1-3, priceDesiredOrStarting, shortDescription]

/// Our site-parts.
app.get('/index', function(req, res)
{
	res.redirect('/');
});
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

app.get('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login'}
	)
);

// get data from form - or present error message?
app.post('/result', function(req, res) 
{
	// Write image
	upload(req,res,function(err) {
		if(err) {
			console.error(err);		
		}
	});
	
	/*
	// BAD input data! Go back to form and display error message.
	if (req.body.funcs == null)
	{
		res.redirect('/newoffer/badFuncs');
		return;
	}
	*/
	var JSONString;
	
	/// Save new offer to file.
	jsonfile.readFile(file, function (err, obj)
	{
		var JSONdata = [];
		if (err)
		{
			console.log("BAD FILE! "+err)
			JSONString = [];
		}
		else 
		{
			JSONdata = obj;
			console.log("File exists.")
		}
		console.log("JSONString: "+JSONString);

		/// Catenate body from request. 
		req.body.image = fileName;
		JSONdata = JSONdata.concat(req.body);
		var newJSONString = JSON.stringify(JSONdata);
		console.log("new JSONString: "+newJSONString);
		
		
		// Write json file
		jsonfile.writeFile(file, JSONdata, function (err) 
		{
			if(err)
				console.error(err)
		});
	});
	
	/// Send immediate reply if data is good?
	// Re-direct to success screen?
	res.redirect('/newoffer/success');
}); 


app.post('/api/photo',function(req,res){
	upload(req,res,function(err) {
		if(err) {
			console.error(err);
			return res.end("Error uploading file.");
			
		}
		res.end("File is uploaded " + JSON.stringify(req.body.username));
		console.log("\n\n\nLOGGGGGG:::::: " + JSON.stringify(req.body));
	});
});

/// Service if others want to integrate offers elsewhere?
app.get('/alldata', function(req, response)
{
   response.writeHead(200, {'Content-Type': 'text/plain'});   
   // Send the response body as "Hello World"
   response.end(JSON.stringify(getPosts()));
//	document.close();
});

app.get('/newoffer', function(req, response)
{
	console.log("req: "+req);
	response.render('newoffer', {
		title: 'New offer'
	});
});

app.get('/newoffer/success', function(req, response)
{
	console.log("success!");
	response.render('newofferSuccess', 
	{	title: 'Offer posted'
	});
});

app.get('/search', function(req, res) {
	if( req.query.username == null && req.query.item == null) {
		res.render('search', {title : 'Search'});
	}
	else
	{
		var criteria = req.query;
		
		var searchResult = doSearch(criteria);
		console.log("\n\CCCC: "+JSON.stringify(searchResult));
		res.render('search', 
			{
				title: 'Search Result', searchResult
			}
		);
	}
});

// Error messages!
app.get('/newoffer/*', function(req, response)
{
	console.log("originalUrl: "+req.originalUrl);
	var returnCode = req.originalUrl.split("/")[2];
	console.log("return Code: "+returnCode);
	response.render('newoffer', {
		title: 'New offer (try again!)',
		failureCode: returnCode
	})
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
