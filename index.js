const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const bodyParser = require('body-parser');
app.use('/', bodyParser.urlencoded({extended: false}));

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect(process.env['MONGO_URI'],
  {useNewUrlParser: true, useUnifiedTopology: true});

let userSchema = new mongoose.Schema({
  username: {type: String, required: true}
});
let User = mongoose.model('User', userSchema);

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (username == "") {
    console.log("empty username")
    return;
  }
  User.exists({username: username}, function(err, user) {
    if (err) {
      console.log("failed User.exists");
      console.error(err);
      return;
    } else if (user != null) {
      console.log("user already exists");
      return;
    } else {
      User.create({username: username}, function(err, user) {
        if (err) {
          console.log("failed User.create");
          console.error(err);
          return;
        } else {
          res.json({
            username: user.username,
            _id: user._id
          });
        }
      })
    }
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, function(err, users) {
    if (err) {
      console.log("failed User.find");
      console.error(err);
      return;
    } else {
      res.send(users);
    }
  });
});

let exerciseSchema = new mongoose.Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date}
});
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users/:_id/exercises', (req, res, next) => {
  const _id = req.params._id;
  if (_id == "") {
    console.log("empty _id")
    return;
  }
  User.findById(_id, function(err, user) {
    if (err) {
      console.log("failed User.findById");
      console.error(err);
      return;
    } else if (user == null) {
      console.log("user does not exist")
      return;
    } else {
      const username = user.username;
      const description = req.body.description;
      if (description == "") {
        console.log("empty description");
        return;
      }
      const duration = Number(req.body.duration);
      if (isNaN(duration)) {
        console.log("non-numeric (or empty) duration")
        return;
      }
      let date = new Date();
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
      date.setMilliseconds(0);
      if (req.body.date != undefined && req.body.date != "") {
        date = new Date(req.body.date);
      }
      if (! date instanceof Date || isNaN(date)) {
        console.log("invalid date");
        return;
      }
      Exercise.create({
	username: username,
	description: description,
	duration: duration,
	date: date},
        function(err, user) {
          if (err) {
            console.log("failed Exercise.create");
            console.error(err);
            return;
          } else {
            res.json({
              username: username,
              description: description,
              duration: duration,
              date: date.toDateString(),
              _id: _id
            });
          }
        }
      );
    }
  })
});

app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;
  if (_id == "") {
    console.log("empty _id")
    return;
  }
  User.findById(_id, function(err, user) {
    if (err) {
      console.log("failed User.findById");
      console.error(err);
      return;
    } else if (user == null) {
      console.log("user does not exist")
      return;
    } else {
      const username = user.username;
      const query = Exercise.find({username: username});
      if (req.query.from != undefined && req.query.from != "") {
        const from = new Date(req.query.from);
	if (! from instanceof Date || isNaN(from)) {
	  console.log("invalid from date");
	  return;
	}
	query.where("date").gte(from);
      }
      if (req.query.to != undefined && req.query.to != "") {
        const to = new Date(req.query.to);
	if (! to instanceof Date || isNaN(to)) {
	  console.log("invalid to date");
	  return;
	}
	query.where("date").lte(to);
      }
      if (req.query.limit != undefined && req.query.limit != "") {
        const limit = Number(req.query.limit);
        if (isNaN(limit)) {
          console.log("non-numeric (or empty) limit")
          return;
        }
	query.limit(limit);
      }
      query.exec(function(err, exercises) {
        if (err) {
          console.log("failed Exercise.find");
          console.error(err);
          return;
        } else {
          const log = exercises.map((exercise) => {
            return {
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date.toDateString()
            };
          });
          res.json({
            username: username,
            count: log.length,
            _id: _id,
            log: log
          });
        }
      });
    }
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
