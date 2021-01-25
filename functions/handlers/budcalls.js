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
}

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
});