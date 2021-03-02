const functions = require("firebase-functions");

const app = require('express')();

const { getAllBudcalls, postOneBudcall } = require('./handlers/budcalls');
const { signup, login, uploadImage, addUserDetails } = require('./handlers/users');

const FBAuth = require('./util/fbAuth');

//var firebaseConfig = require('./firebaseConfig');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

//budcalls routes
app.get('/budcalls', getAllBudcalls);
app.post('/budcall', FBAuth, postOneBudcall);

//users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

exports.api = functions.https.onRequest(app);