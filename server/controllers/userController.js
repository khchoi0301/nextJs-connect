const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.getUsers = async (req, res) => {
    const users = await User.find().select("_id name email createdAt updatedAt");
    res.json(users);
};

exports.getAuthUser = (req, res) => {
    if (!req.isAuthUser) {
        res.status(403).json({
            message: "You are unauthenticated. please sign in or sign up"
        })
        return res.redirect("/signin");
    }
    res.json(req.user);
};

exports.getUserById = async (req, res, next, id) => {
    const user = await User.findOne({ _id: id });
    req.profile = user;

    const profileId = mongoose.Types.ObjectId(req.profile._id);

    if (profileId.equals(req.user._id)) {
        req.isAuthUser = true;
        // 해당 id에 대한 요청이 자기 자신에 대한 요청인지 확인 하여 req에 flag 형태로 추가
    }
    return next();
};

exports.getUserProfile = (req, res) => {
    if (!req.profile) {
        return res.status(404).json({
            message: "No user found"
        })
    }
    res.json(req.profile);
};

exports.getUserFeed = () => { };

exports.uploadAvatar = () => { };

exports.resizeAvatar = () => { };

exports.updateUser = () => { };

exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    if (!req.isAuthUser) {
        return res.status(400).json({ message: "You are not authorized to perform this action" })
    }
    const deletedUser = await User.findOneAndDelete({ _id: userId });
    res.json(deletedUser);
};

exports.addFollowing = async (req, res, next) => {
    const { followId } = req.body;
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { following: followId } }
        // The mongoose $push operator appends a specified value to an array.
    )
    next();
};

exports.addFollower = async (req, res) => {
    const { followId } = req.body;
    const user = await User.findOneAndUpdate(
        { _id: followId },
        { $push: { followers: req.user._id } },
        { new: true } // return only updated item
    )
    res.json(user);
};

exports.deleteFollowing = async (req, res, next) => {
    const { followId } = req.body;
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { following: followId } }
        // The mongoose $push operator appends a specified value to an array.
    )
    next();
};

exports.deleteFollower = async (req, res) => {
    const { followId } = req.body;
    const user = await User.findOneAndUpdate(
        { _id: followId },
        { $pull: { followers: req.user._id } },
        { new: true } // return only updated item
    )
    res.json(user);
};
