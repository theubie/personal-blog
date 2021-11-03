//Required modules
require('dotenv').config()
const fs = require('fs');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');


//User settings check
if (!fs.existsSync(__dirname + '/.env')) {
  //env file does not exist.  Create default
  console.log(".env file does not exist.  Creating default .env file.");
  var envFile = fs.createWriteStream(__dirname + '/.env', {
    flags: 'a'
  })
  envFile.write('APP_PORT=3000\n');
  envFile.write('APP_HOST=localhost\n');
  envFile.write('DB_PORT=27017\n');
  envFile.write('DB_HOST=localhost\n');
  envFile.write('DB_NAME=mySimpleBlog\n');
  envFile.end();
};

if (!process.env.APP_PORT) {
  console.log("Failed to find APP_PORT.  Assuming APP_PORT is 3000.  To correct this, create a .env file with APP_PORT=<port number> or set the APP_PORT environmental variable before running this app.");
  process.env.APP_PORT = 3000;
}
if (!process.env.APP_HOST) {
  console.log("Failed to find APP_HOST.  Assuming APP_HOST is localhost.  To correct this, create a .env file with APP_HOST=<host name or IP> or set the APP_HOST environmental variable before running this app");
  process.env.APP_HOST = "localhost";
}
if (!process.env.DB_PORT) {
  console.log("Failed to find DB_PORT.  Assuming APP_PORT is 27017.  To correct this, create a .env file with DB_PORT=<port number> or set the DB_PORT environmental variable before running this app.");
  process.env.DB_PORT = 27017;
}
if (!process.env.DB_HOST) {
  console.log("Failed to find DB_HOST.  Assuming DB_HOST is localhost.  To correct this, create a .env file with DB_HOST=<host name or IP> or set the APP_HOST environmental variable before running this app");
  process.env.DB_HOST = "localhost";
}
if (!process.env.DB_NAME) {
  console.log("Failed to find DB_NAME.  Assuming DB_NAME is mySimpleBlog.  To correct this, create a .env file with DB_NAME=<host name or IP> or set the DB_NAME environmental variable before running this app");
  process.env.DB_NAME = "mySimpleBlog";
}


//Main page info
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

//Create the app
const app = express();

//Setup the template engine
app.set('view engine', 'ejs');

//Add middleware
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//database connection
mongoose.connect("mongodb://" + process.env.DB_HOST + ":" + process.env.DB_PORT + "/" + process.env.DB_NAME, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to MongoDB via Mongoose at " + process.env.DB_HOST + " on port " + process.env.DB_PORT + " using database " + process.env.DB_NAME);
  }
});

//Schema
const postSchema = new mongoose.Schema({
  title: String,
  content: String
})

//Model
const Post = mongoose.model('Post', postSchema);

//Static Routes
app.get("/", function(req, res) {
  Post.find({}, (err, posts) => {
    res.render("home", {
      startingContent: homeStartingContent,
      blogPosts: posts
    });
  })
});

app.get("/about", function(req, res) {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    contactContent: contactContent
  });
});

//Compose route
app.get("/compose", function(req, res) {
  res.render("compose");
});

app.post("/compose", function(req, res) {
  //Gather the form data
  const post = new Post({
    title: sanitize(req.body.postTitle),
    content: sanitize(req.body.postBody)
  });
  post.save();
  //Redirect to the main page
  res.redirect("/");
})

//Posts route to dynamically display individual posts
app.get("/posts/:title", function(req, res) {
  //Kitten.find({ name: /fluff/i }, callback)
  Post.findOne({
    title: new RegExp('^' + _.lowerCase(req.params.title), "i")
  }, (err,post) => {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else if (!post) {
      console.log("Post not found for " + _.lowerCase(req.params.title));
      console.log("Searched for: " + new RegExp('^' + _.lowerCase(req.params.title), "i"));
      res.redirect("/");
    } else {
      res.render("post", {
        post: post
      });
    }
  });
});

//Spin up the app
app.listen(process.env.APP_PORT, process.env.APP_HOST, function() {
  console.log("Server started at " + process.env.APP_HOST + " on port " + process.env.APP_PORT);
});
