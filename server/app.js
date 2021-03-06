var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();
var OrientoStore = require('connect-oriento')(session);
var OrientDB = require('orientjs');
var server = OrientDB({
  host:'localhost',
  port: 2424,
  username: 'root',
  password: '1234'
});
var db = server.use('o2');


var app= express();


app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: '12312!@!@fsfioj',
  resave: false,
  saveUninitialized: true,
  store: new OrientoStore({
    server:'host=localhost&port=2424&username=root&password=1234&db=o2'
  })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('public'));

app.post('/auth/register',function(req,res){
  hasher( {password: req.body.password},function(err, pass, salt, hash){
    var user = {
      authId: 'local:'+req.body.username,
      username: req.body.username,
      password: hash,
      salt:salt,
      displayName:req.body.displayName
    };
    var sql = 'INSERT INTO user (authId, username,password, salt,displayName) VALUES(:authId, :username,:password, :salt,:displayName)';
      db.query(sql,{
        params:user
      }).then(function(results){
        req.login(user, function(err){
          req.session.save(function(){
            res.redirect('/welcome');
          });
        });
      }, function(error){
        console.log(error);
        res.status(500);
      });

  });
  

});

app.get('/auth/register',function(req,res){
  var output=`

  <form action="/auth/register" method="post">
    <p>
      <input type="text" name="username" placeholder="username">
    </p>
    <p>
      <input type="password" name="password" placeholder="password">
    </p>
    <p>
      <input type="text" name="displayName" placeholder="displayName">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  `;

  res.send(output);

});

passport.serializeUser(function(user, done) {
  done(null, user.authId);
});

passport.deserializeUser(function(id,done){
  var sql = "SELECT displayName FROM user WHERE authId =:authId";
  db.query(sql, {params:{authId:id}}).then(function(results){
    if(results.lenth===0){
      done('there is no user');
    }else{
      return done(null,results[0]);
    }
  });
});

passport.use(new LocalStrategy(
  function(username, password, done){

    var uname = username;
    var pwd = password;

    var sql= 'SELECT * FROM user WHERE authId=:authId';
    db.query(sql, {params: {authId:'local:'+uname}}).then(function(results){
      if(results.length === 0 ){
        return done(null,false);
      }
      var user = results[0];
      return hasher( {password:pwd, salt:user.salt}, function(err, pass, salt, hash){
        if( hash === user.password){
          done(null, user);
        }else{
          done(null, false);
        }
      });
      console.log(results);
    })
  
  }
));

passport.use(new FacebookStrategy({
  clientID: '182603975513427',
  clienctSecret:'414092b774886a3e9306845b3f1b892a',
  callbackURL:"/auth/facebook/callback"
  profileFields:['id','email','gender','link','locale','name'
  , 'timezone', 'updated_time', 'verified', 'displayName']
  },
  function(accessToken, refreshToken, profile, done){
    var authId = 'facebook:'+profile.id;
    var sql = 'SELECT FROM user WHERE authId=:authId';

    db.query(sql, {params:{authId:authId}}).then(function(results){
      if(results.length ===0){
        var newuser = {
          'authId':authId,
          'displayName':profile.displayName,
          'email':profile.emails[0].value
        };
        var sql = 'INSERT INTO user (authId,displayName,email) VALUES(:authId, :displayName, :email';
        db.query(sql, {params:newuser}).then(function(){
          done(null,newuser);
        }, function(error){
          console.log(error);
          done('Error');
        })
      }else{
        return done(null,results[0]);
      }
    })
  }
  
    
));


app.post('/test',function(req,res){
  //res.send(req.body.test);
  res.send('test.html',{aa:'tset'});
});

app.post('/auth/login', 
    passport.authenticate(
      'local', 
      { 
        successRedirect: '/welcome', 
        failureRedirect: '/auth/login',
        failureFlash: false
      }
    )
);

app.get('/auth/facebook/callback',
    passport.authenticate(
      'facebook',
      {
        successRedirect:'/welcome',
        failureRedirect:'/auth/login'
      }
   )
);


app.get('/auth/facebook',
    passport.authenticate(

      'facebook'
      {scope:'email'}
    )
);

app.get('/auth/login',function(req, res){
  var output=`

  <form action="/auth/login" method="post">
    <p>
      <input type="text" name="username" placeholder="username">
    </p>
    <p>
      <input type="password" name="password" placeholder="password">
    </p>
    <p>
      <input type="submit">
    </p>
  </form>
  <a href="/auth/facebook"> facebook</a>
  `;
  

  res.send(output);
});

app.get('/auth/logout', function(req, res){
  req.logout();
  req.session.save(function(){

    res.redirect('/welcome');
  });
});

app.get('/welcome', function(req, res){

  if( req.user && req.user.displayName){
    res.render('/pages/main.html');
//    res.send(`
//      <h1> hello, ${req.user.displayName} </h1>
//      <a href="/auth/logout">logout</a>
//      `);
  }else{
    res.send('/pages/main.html');
//    res.send(`
//      <h1>welcome</h1>
//      <ul>
//        <li><a href="/auth/login">login</a>
//        <li><a href="/auth/register">register</a>
//      </ul>
//      `);
  }
});



//app.post('/auth/login', function(req,res){
//
//  var uname = req.body.username;
//  var pwd = req.body.password;
//  var displayName = 'aa';
//
//  if(uname === user.username){
//    return hasher( {password:pwd, salt:salt}, function(err, pass, salt, hash){
//        if( hash === user.password){
//          req.session.displayName = user.displayName;
//          req.session.save(function(){
//            res.redirect('/welcome');
//          });
//
//        }else{
//          res.send(`who are you? <a href="/auth/login">login</a>`);
//
//        }
//      
//      });
//    }
//
////  if( uname == user.username && pwd == user.password){
////    res.send("hello user");
////    req.session.displayName = diplayName;
////    req.session.save(function(){
////      res.redirect('/welcome');
////    });
////    res.redirect('/welcome');
////  }else{
////    res.send(`who are you? <a href="/auth/login">login</a>`);
////  }
//
//});


app.listen(3003,function(){
  console.log('connected 3003 port!!!')
});

