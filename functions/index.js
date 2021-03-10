const functions = require("firebase-functions");

const app = require('express')();

const { db } = require('./util/admin');

const { 
     getAllBudcalls,
     postOneBudcall, 
     getBudcall, 
     commentOnBudcall,
     likeBudcall,
     unlikeBudcall,
     deleteBudcall 
    } = require('./handlers/budcalls');
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser } = require('./handlers/users');

const FBAuth = require('./util/fbAuth');

//var firebaseConfig = require('./firebaseConfig');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

//Budcall routes
app.get('/budcalls', getAllBudcalls);
app.post('/budcall', FBAuth, postOneBudcall);
app.get('/budcall/:budcallId', getBudcall);
app.delete('/budcall/:budcallId', FBAuth, deleteBudcall);

app.get('/budcall/:budcallId/like', FBAuth, likeBudcall);
app.get('/budcall/:budcallId/unlike', FBAuth, unlikeBudcall);
app.post('/budcall/:budcallId/comment', FBAuth, commentOnBudcall);



//users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
.region('us-central1')
.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/budcalls/${snapshot.data().budcallId}`).get()
        .then(doc => {
            if(doc.exists){
                return db.doc(`/notifcation/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    budcallId: doc.id
                });
            }
        })
        .then(() => {
            return;
        })
        .catch(err => {
            console.error(err);
            return;
        });
    });

exports.deleteNotificationOnUnlike = functions
.region('us-central1')
.firestore.document('likes/{id}')
.onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .then(() => {
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    });
});

exports.createNotificationOnComment = functions
.region('us-central1')
.firestore.document('comments/{id}')
.onCreate((snapshot) => {
    db.doc(`/budcalls/${snapshot.data().budcallId}`).get()
        .then(doc => {
            if(doc.exists){
                return db.doc(`/notifcation/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    budcallId: doc.id
                });
            }
        })
        .then(() => {
            return;
        })
        .catch(err => {
            console.error(err);
            return;
        });
});