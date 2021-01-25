const functions = require("firebase-functions");

const app = require('express')();

const { getAllBudcalls } = require('./handlers/budcalls');


//var firebaseConfig = require('./firebaseConfig');

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);




// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

//Get all budcalls route
app.get('/budcalls', getAllBudcalls);



const FBAuth = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    }
    else{
        console.error('No token found');
        return res.status(403).json({error: 'Unauthorized'});
    }

    admin.auth().verifyIdToken(idToken).then(decodedToken => {
        req.user = decodedToken;
        console.log(decodedToken);
        return db.collection('users').where('userId', '==', req.user.uid).limit(1).get();
    }).then(data => {
        req.user.handle = data.docs[0].data().handle;
        return next();
    }
        )
        .catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err);
        })
}


//Create a new budcall
app.post('/budcall', FBAuth, postOneBudcall);

//Determine whether email input from user is valid
const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

if (email.match(emailRegEx)){
    return true;
} 
else {
    return false;
}
}

//Determine whether a string is empty
const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

//Sign up new user
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


//Login
app.post('/login', (req,res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    let errors = {};

    if(isEmpty(user.email)){
        errors.email = 'Must not be empty';
    }
    if(isEmpty(user.password)){
        errors.password = 'Must not be empty';
    }

    if(Object.keys(errors).length > 0){
        return res.status(400).json(errors);
    }

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken();
    })
    .then(token => {
        return res.json({token});
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/wrong-password'){
            return res.status(403).json({general: 'Wrong credentials, please try again'})
        }
        else{
            return res.status(500).json({error: err.code});

        }
    });
});

exports.api = functions.https.onRequest(app);