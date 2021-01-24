const functions = require("firebase-functions");
const admin = require('firebase-admin');

const app = require('express')();

admin.initializeApp();


var firebaseConfig = require('./firebaseConfig');

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();



// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

app.get('/budcalls', (req, res) => {
        db
            .collection('budcalls')
            .orderBy('createdAt', 'desc')
            .get()
            .then((data) => {
                let budcalls = [];
                data.forEach((doc) => {
                    budcalls.push({
                        budcallId: doc.id,
                        body: doc.data().body,
                        userHandle: doc.data().userHandle,
                        createdAt: doc.data().createdAt,
                        commentCount: doc.data().commentCount,
                        likeCount: doc.data().likeCount
                    });
                });
                return res.json(budcalls);
            })
            .catch((err) => console.error(err));
    }

);

app.post('/budcall', (req, res) => {

    const newBudcall = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        //location: new firebase.firestore.GeoPoint(latitude, longitude),  
        createdAt: new Date().toISOString()
        // dateSet: admin.firestore.Timestamp.fromDate(new Date())
    };

    db
        .collection('budcalls')
        .add(newBudcall)
        .then(doc => {
            res.json({
                message: `document ${doc.id} created successfully`
            });
        })
        .catch(err => {
            res.status(500).json({
                error: 'something went wrong'
            });
            console.error(err);
        });
});

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

if (email.match(emailRegEx)){
    return true;
} 
else {
    return false;
}
}

const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Email must not be empty';
    } else if(!isEmail(newUser.email)){
    errors.email = 'Must be a valid email address';
    }

    if(isEmpty(newUser.password)){
        errors.password = 'Password Must not empty';
    }

    if(newUser.password !== newUser.confirmPassword){
        errors.confirmPassword = "Passwords must match";
    }

    if(isEmpty(newUser.handle)){
        errors.handle = 'Handle must not empty';
    }

if(Object.keys(errors).length > 0){
    return res.status(400).json(errors);
}
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({
                    handle: 'this handle is already taken'
                });
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);

            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();

        })

        .then((idToken) => {

            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };

            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })

        .then(() => {
            res.status(201).json({
                token
            });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({
                    email: 'Email is already in use'
                });
            } else {
                return res.status(500).json({
                    error: err.code
                });
            }
            return res.status(500).json({
                error: err.code
            });
        });
});


exports.api = functions.https.onRequest(app);