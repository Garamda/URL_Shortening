var http = require('http');
var express = require('express');
var bodyParser  = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

app.set('view engine', 'pug')
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'physics94',
  port     : 3306,
  database : 'my_db'
});

connection.connect();

var shortUrlTable = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P',
'Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
'q','r','s','t','u','v','w','x','y','z'];

app.get('/', function(req, res){
	res.render('form');
});

app.listen(8000, function(){
	console.log("server is ready on port 8000!");
});

app.post('/urlShortening', function(req, res){
	console.log(req.body.url);
	var originalUrl = req.body.url;
	var num = -1;

	// **** 중복 url 체크 -> 콜백을 걸어야 함
	var sql = 'SELECT * FROM url';
	connection.query(sql, function(err, rows, fields) {
	  	for (i = 0; i < rows.length; ++i) 
	  	{ 
	  		if(rows[i].original == originalUrl)
	  		{
	  			console.log("duplicated!");
	  			num = i;
	  			break;
	  		}
		}

		if(num != -1) // 주어진 url이 이미 db에 있는 경우
		{
			console.log(num);
			res.render('form',{newUrl : 'http://127.0.0.1:8000/' + rows[num].short});
		}
		else // 새로 url을 줄여서 db에 넣는 경우
		{

			connection.query(sql, function(err, rows, fields) {
			  if (!err)
			  {

			  	//console.log('The entire table : ', rows);

			  	var url_62 = new Array();

			  	for (i = 0; i < rows.length; ++i) { 
			  		//console.log(rows[i]);
			  		var num = i;
			  		for (k = 0; k < 8; ++k) { 
			  			var one = num%62;
			  			url_62[7-k] = one;

			  			num = parseInt(num/62);
			  			if(num == 0) break;
					}
					//console.log('62ed number is : ');
					//console.log(url_62);
				}

				var shortUrl = '';

				for (i = 0; i < 8; ++i) { 
					var now = url_62[i];
					if(now == undefined) continue;
					shortUrl += shortUrlTable[now];
			  	}

			  	console.log(shortUrl);
			  	localhostUrl = 'http://127.0.0.1:8000/'+shortUrl;
			 	console.log('New localhostUrl is : ',localhostUrl);

			 	var sql = 'INSERT INTO url (original, short) VALUES(?,?)';
				var params = [originalUrl, shortUrl];

				connection.query(sql, params, function(err, rows, fields){
		    		if(err) console.log(err);
		    		console.log(rows.insertId);
				});	 	
			  }
			  else
			    console.log('Error while performing Query.', err);

				res.render('form',{newUrl : localhostUrl});
			});		
		}
	});


});

// 리다이렉트

app.get('/:shorten', function(req, res) {
    var shortenId = req.params.shorten;
    //console.log(typeof(shortenId));
    var sql = 'SELECT original FROM url WHERE short = ?';
    //console.log(sql);
	connection.query(sql, [shortenId], function(err, row, fields){
    	if(err) // 해당 url을 못 찾았을 시 처음으로 되돌아 감 
    	{
    		console.log(err);
    		res.redirect('/');
    	}
    	else // 성공 시 
    	{
    		// *** 여기서 한 번씩 왜 다른 곳에 접근? (db 인덱싱이 완전 잘못 될 때가 있음.)
    		console.log('success!!');
    		for (i = 0; i < row.length; ++i) { 
		  		console.log(row[i]);
			}
    		console.log(row[0]);
    		console.log(row[0].original);
    		res.redirect(row[0].original);
    	}
    	//console.log(row.insertId);
	});	


});

//connection.end();
