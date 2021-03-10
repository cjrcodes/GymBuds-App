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
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead 
} = require('./handlers/users');

const FBAuth = require('./util/fbAuth');

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
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
.region('us-central1')
.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/budcalls/${snapshot.data().budcallId}`).get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    budcallId: doc.id
                });
            }
        })
     
        .catch((err) => 
            console.error(err));
    });

exports.deleteNotificationOnUnlike = functions
.region('us-central1')
.firestore.document('likes/{id}')
.onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .catch(err => {
        console.error(err);
        return;
    });
});

exports.createNotificationOnComment = functions
.region('us-central1')
.firestore.document('comments/{id}')
.onCreate((snapshot) => {
    return db.doc(`/budcalls/${snapshot.data().budcallId}`).get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    budcallId: doc.id
                });
            }
        })
      
        .catch(err => {
            console.error(err);
            return;
        });
});

exports.onUserImageChange = functions.region('us-central1').firestore.document('/users/{userId').
onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
   if(change.before.data().imageUrl !== change.after.data().imageUrl){
       console.log("Image has changed"); 
       let batch = db.batch();
       return db.collection('budcalls').where('userHandle', '==', change.before.data().handle).get()
       .then((data) => {
           data.forEach(doc => {
               const scream = db.doc(`/budcalls/${doc.id}`);
               batch.update(budcall, { userImage: change.after.data().imageUrl});
           });
           return batch.commit();
       });
   }
});

exports.onBudcallDelete = functions.region('us-central1').firestore.document('/users/{userId').onDelete((snapshot, context) => {
    const budcallId = context.params.budcallId;
    const batch = db.batch();

    return db.collection('comments').where('budcallId', '==', budcallId).get()
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('budcallId', '==', budcallId);
    }).then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('budcallId', '==', budcallId);
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
    })
    .catch((err) => {
        console.error(err);
    });
});