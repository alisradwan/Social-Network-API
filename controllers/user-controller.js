const { User, Thought } = require("../models");

module.exports = {
  // Get all Users
  getAllUsers(req, res) {
    User.find({})
      .select("-__v")
      .then((dbUserData) => res.json(dbUserData))
      .catch((err) => res.status(500).json(err));
  },

  // GET a single user by its _id and populated thought and friend data
  getUserById(req, res) {
    User.findOne({ _id: req.params.UserId })
      .populate([
        { path: "thoughts", select: "-__v" },
        { path: "friends", select: "-__v" },
      ])
      .select("-__v")
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No user found with this id" });
          return;
        }
        res.json(dbUserData);
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  //POST a new user
  createUser(req, res) {
    User.create(req.body)
      .then((dbUserData) => res.json(dbUserData))
      .catch((err) => res.status(500).json(err));
  },

  updateUser(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.UserId },
      { $set: req.body },
      { runValidators: true, new: true }
    )
      .then((dbUserData) =>
        !dbUserData
          ? res.status(404).json({ message: "No user found with this id!" })
          : res.json(dbUserData)
      )
      .catch((err) => res.status(500).json(err));
  },

  deleteUser({ params }, res) {
    // delete the user
    User.findOneAndDelete({ _id: params.id })
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No user found with this id" });
          return;
        }
        // remove the user from any friends arrays
        User.updateMany(
          { _id: { $in: dbUserData.friends } },
          { $pull: { friends: params.id } }
        )
          .then(() => {
            // remove any comments from this user
            Thought.deleteMany({ username: dbUserData.username })
              .then(() => {
                res.json({ message: "Successfully deleted user" });
              })
              .catch((err) => res.status(400).json(err));
          })
          .catch((err) => res.status(400).json(err));
      })
      .catch((err) => res.status(400).json(err));
  },

  // POST /api/users/:userId/friends/:friendId
  addFriend({ params }, res) {
    // add friendId to userId's friend list
    User.findOneAndUpdate(
      { _id: params.userId },
      { $addToSet: { friends: params.friendId } },
      { new: true, runValidators: true }
    )
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No user found with this userId" });
          return;
        }
        // add userId to friendId's friend list
        User.findOneAndUpdate(
          { _id: params.friendId },
          { $addToSet: { friends: params.userId } },
          { new: true, runValidators: true }
        )
          .then((dbUserData2) => {
            if (!dbUserData2) {
              res
                .status(404)
                .json({ message: "No user found with this friendId" });
              return;
            }
            res.json(dbUserData);
          })
          .catch((err) => res.json(err));
      })
      .catch((err) => res.json(err));
  },

  // DELETE /api/users/:userId/friends/:friendId
  deleteFriend({ params }, res) {
    // remove friendId from userId's friend list
    User.findOneAndUpdate(
      { _id: params.userId },
      { $pull: { friends: params.friendId } },
      { new: true, runValidators: true }
    )
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No user found with this userId" });
          return;
        }
        // remove userId from friendId's friend list
        User.findOneAndUpdate(
          { _id: params.friendId },
          { $pull: { friends: params.userId } },
          { new: true, runValidators: true }
        )
          .then((dbUserData2) => {
            if (!dbUserData2) {
              res
                .status(404)
                .json({ message: "No user found with this friendId" });
              return;
            }
            res.json({ message: "Successfully deleted the friend" });
          })
          .catch((err) => res.json(err));
      })
      .catch((err) => res.json(err));
  },
};
