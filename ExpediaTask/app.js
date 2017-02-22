var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var cluster=require('cluster');
const https = require('https');


//Static public folder (images,css ..etc)
app.use(express.static(path.join(__dirname,'public')));

//Current Process to start listening for incoming requests
app.listen(process.env.PORT || 3000, function() {
  console.log("Api is listening");
});


var hotelMap={};////Key is the id of hotel and value is hotel object reference
var mainJson=[];/// Will contain a simplified (smaller) version of the hotels data; contatining data for hotels that are only required in front page
var data={};//// The Full Version Json object, fetched from expedia.com
var searchMap={};

var getHotel=function(id) //Will return a reference to the hotel object with the specified Id
{
	
	return data.offers==undefined?undefined:data.offers.Hotel[hotelMap[Number(id)]];	
}

var prepareMap=function(obj) /////Change name to extract
{
	if(obj!=undefined && obj.offers.Hotel!=undefined) // Not Replacing cached(temp-saved) data if no results found from expedia.com
	data=obj;



	else{ 
		console.log('No results');
		return ;
	}

	for(var i=0;i<data.offers.Hotel.length;++i)       /////IMPORTANT-Extracting a new object which contatins ONLY required attributes in main page
	{
		hotelMap[Number(data.offers.Hotel[i].hotelInfo.hotelId)]=i;///Attaching hotelMap where key is the id of hotel and value is hotel object reference
		data.offers.Hotel[i].hotelUrgencyInfo.link=data.offers.Hotel[i].hotelUrgencyInfo.link.replace('#','?'); //replacing in link to ? to make parameters extraction eaiser (e.g req.query)


		mainJson[i]={}; //Pushing a new object
		mainJson[i].hotelInfo={};
		mainJson[i].hotelUrgencyInfo={};
		mainJson[i].hotelPricingInfo=data.offers.Hotel[i].hotelPricingInfo;
		mainJson[i].destination={};

		//Needed parameters in main page
		mainJson[i].hotelInfo.hotelImageUrl=data.offers.Hotel[i].hotelInfo.hotelImageUrl;
		mainJson[i].hotelUrgencyInfo.link=data.offers.Hotel[i].hotelUrgencyInfo.link;
		mainJson[i].hotelInfo.hotelName=data.offers.Hotel[i].hotelInfo.hotelName;
		mainJson[i].hotelInfo.hotelStarRating=data.offers.Hotel[i].hotelInfo.hotelStarRating;
		mainJson[i].destination.regionID=data.offers.Hotel[i].destination.regionID;
		mainJson[i].destination.longName=data.offers.Hotel[i].destination.longName;
		mainJson[i].hotelInfo.hotelGuestReviewRating=data.offers.Hotel[i].hotelInfo.hotelGuestReviewRating;
		mainJson[i].hotelInfo.carPackage=data.offers.Hotel[i].hotelInfo.carPackage;
		mainJson[i].hotelInfo.allInclusive=data.offers.Hotel[i].hotelInfo.allInclusive;
		mainJson[i].hotelPricingInfo.totalPriceValue=data.offers.Hotel[i].hotelPricingInfo.totalPriceValue;
	}



}

var fetch=function(Url,response,template,callback)    // Generic Fetch, used to make requests to expedia.com and calling the callbacks functions which responds to clients
{
	
	https.get(Url, function(res){
		console.log("statusCode: ", res.statusCode); 
    var body = '';

    res.on('data', function(chunk){
        body += chunk;           ////Concatenating recieved chuncks.
    });

    res.on('end', function(){  /////All Chunks are received

        var obj = JSON.parse(body);  //////Parsing the receieved JSON   
        if(callback)
        callback(response,template,obj);/////Calling the callback which is passed as a parameter
    	else                            /////In case a regular fetch without responding to a request
    		prepareMap(obj);                 


    });
}).on('error', function(e){
      console.log("erroreee");
});
}

// view engine setup (path of dynamic content pages)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Config express.js instance
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Expedia Main Url
var url="https://offersvc.expedia.com/offers/v2/getOffers?scenario=deal-finder&page=foo&uid=foo&productType=Hotel";
var mainURI="https://powerful-bastion-38270.herokuapp.com";


app.get('/*', function(req, res, next){ 
  res.setHeader('Last-Modified', (new Date()).toUTCString()); ///Prevenet client side browser from caching
  next(); 
});


//In case of a GET request; searching for hotels handeling.
app.get('/search*', function (req, res) {

let URL=url;

for (var key in req.query )         //Eliminating empty parameters
	if(req.query[key]!='')
		if(key.toString().includes('Date'))  ////Changing parameter for any Date parameter
	URL+='&'+key+'=:'+req.query[key];
else
	URL+='&'+key+'='+req.query[key];

console.log(URL);

fetch(URL,res,'index',function(ers,temp,obj){
		if(obj!=undefined)
			prepareMap(obj);

	ers.render(temp, { hotels:mainJson,mainURL:mainURI});//res.render will send a dynamic content html page
	});

});

//Main page GET request handeling
app.get('/', function (req, res) {
	fetch(url,res,'index',function(ers,temp,obj){
		if(obj!=undefined)
			prepareMap(obj);

	ers.render(temp, { hotels:mainJson,mainURL:mainURI});//res.render will send a dynamic content html page
	});
});

//Getting full information about a specific Hotel

app.get('/Hotel-Search*', function (req, res) {
let id=req.query['selected'];           ///////Extracting the hotel Id to search for

var ref=getHotel(id);					
if(ref!=undefined)						///Validating retrieved hotel reference 
res.render('hotel-detail',{hotel:ref});   //getHotel will return a reference to the specified hotel from the cached response, res.render will send a dynamic content html page
else
	console.log('No match found');    //Most likly a dummy request from the user
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  //var err = new Error('Not Found');
  //err.status = 404;
  next();
});



//In case of a worker process death, fork another process to replace it
cluster.on('exit',function()
	{
		console.log('Worker Has Died');
		cluster.fork();
	});
module.exports = app;
