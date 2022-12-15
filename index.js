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
mongoose.connect(process.env['MONGO_URI'], {useNewUrlParser: true, useUnifiedTopology: true});

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


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
