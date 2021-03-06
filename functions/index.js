const functions = require("firebase-functions");

const app = require('express')();

const { getAllBudcalls, postOneBudcall, getBudcall, commentOnBudcall } = require('./handlers/budcalls');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');

const FBAuth = require('./util/fbAuth');

//var firebaseConfig = require('./firebaseConfig');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

//budcalls routes
app.get('/budcalls', getAllBudcalls);
app.post('/budcall', FBAuth, postOneBudcall);
app.get('/budcall/:budcallId', getBudcall);
//TODO: Delete budcall

//TODO: Like budcall

//TODO: Unlike a budcall

app.post('/budcall/:budcallId/comment', FBAuth, commentOnScream);



//users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);