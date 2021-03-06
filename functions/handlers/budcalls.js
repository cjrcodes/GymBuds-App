const { db } = require('../util/admin');

exports.getAllBudcalls = (req, res) => {
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
};

exports.postOneBudcall = (req, res) => {

    

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
};

//Get a budcall
exports.getBudcall = (req, res) => {
    let budcallData = {};

    db.doc(`/budcalls/${req.params.budcallId}`).get().then(doc => {
        if(!doc.exists){
            return res.status(404).json({error: 'Budcall not found'});
        }

        budcallData = doc.data();

        budcallData.budcallId = doc.id;

        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('budcallId', '==', req.params.budcallId)
        .get();


    })
    .then(data => {
        budcallData.comments = [];
        data.forEach(doc => {
            budcallData.comments.push(doc.data());
        });
        return res.json(budcallData);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error:err.code});
    });

};

//Comment on a budcall

exports.commentOnBudcall = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({error: 'Must not be empty'});

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        budcallId: req.params.budcallID,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/budcalls/${req.params.budcalls}`).get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({error: 'Scream not found'});
        }

        return db.collection('comments').add(newComment);
    })
    .then(() => {
        res.json(newComment);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: 'Something went wrong'});
    });


};