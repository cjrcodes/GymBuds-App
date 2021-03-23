const { db } = require("../util/admin");

exports.getAllBudcalls = (req, res) => {
  db.collection("budcalls")
    .orderBy("createdAt", "desc")
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
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage,
        });
      });
      return res.json(budcalls);
    })
    .catch((err) => console.error(err));
};

exports.postOneBudcall = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  const newBudcall = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    //location: new firebase.firestore.GeoPoint(latitude, longitude),
    // dateSet: admin.firestore.Timestamp.fromDate(new Date())
  };

  db.collection("budcalls")
    .add(newBudcall)
    .then((doc) => {
      const resBudcall = newBudcall;
      resBudcall.budcallId = doc.id;
      res.json(resBudcall);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Something went wrong",
      });
      console.error(err);
    });
};

//Get a budcall
exports.getBudcall = (req, res) => {
  let budcallData = {};

  db.doc(`/budcalls/${req.params.budcallId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Budcall not found" });
      }

      budcallData = doc.data();

      budcallData.budcallId = doc.id;

      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("budcallId", "==", req.params.budcallId)
        .get();
    })
    .then((data) => {
      budcallData.comments = [];
      data.forEach((doc) => {
        budcallData.comments.push(doc.data());
      });
      return res.json(budcallData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Comment on a budcall

exports.commentOnBudcall = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    budcallId: req.params.budcallId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/budcalls/${req.params.budcallId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Budcall not found" });
      }

      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

//Like a budcall
exports.likeBudcall = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("budcallId", "==", req.params.budcallId)
    .limit(1);

  const budcallDocument = db.doc(`/budcalls/${req.params.budcallId}`);

  let budcallData = {};

  budcallDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        budcallData = doc.data();
        budcallData.budcallId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Budcall not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            budcallId: req.params.budcallId,
            userHandle: req.user.handle,
          })
          .then(() => {
            budcallData.likeCount++;
            return budcallDocument.update({ likeCount: budcallData.likeCount });
          })
          .then(() => {
            return res.json(budcallData);
          });
      } else {
        return res.status(400).json({ error: "Budcall already liked" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeBudcall = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("budcallId", "==", req.params.budcallId)
    .limit(1);

  const budcallDocument = db.doc(`/budcalls/${req.params.budcallId}`);

  let budcallData = {};

  budcallDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        budcallData = doc.data();
        budcallData.budcallId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Budcall not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Budcall already unliked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            budcallData.likeCount--;
            return budcallDocument.update({ likeCount: budcallData.likeCount });
          })
          .then(() => {
            res.json(budcallData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Delete budcall

exports.deleteBudcall = (req, res) => {
  const document = db.doc(`/budcalls/${req.params.budcallId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Budcall not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Budcall deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
