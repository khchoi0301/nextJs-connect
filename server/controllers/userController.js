const mongoose = require("mongoose");
const User = mongoose.model("User");
const multer = require("multer");
const jimp = require("jimp");

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

exports.getUserFeed = async (req, res) => {
    const { following, _id } = req.profile;
    following.push(_id) // following + 본인
    const users = await User
        .find({ _id: { $nin: following } }) // the field value is Not in the specified array
        .select('_id name avatar')

    res.json(users);
};

const avatarUploadOptions = {
    storage: multer.memoryStorage(),
    limit: {
        fileSize: 1024 * 1024 * 1 // 1mb
    },
    fileFilter: (req, file, next) => {
        if (file.mimetype.startsWith('image/')) {
            next(null, true);
        } else {
            next(null, false)
        }
    }
}
exports.uploadAvatar = multer(avatarUploadOptions).single('avatar');

exports.resizeAvatar = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    const extension = req.file.mimetype.split("/")[1];
    req.body.avatar = `/static/uploads/avatars/${req.user.name}-${Date.now()}.${extension}`
    const image = await jimp.read(req.file.buffer);
    await image.resize(250, jimp.AUTO);
    await image.write(`./${req.body.avatar}`);
    next();
};

exports.updateUser = async (req, res) => {
    req.body.updatedAt = new Date().toISOString; // expected output: 2011-10-05T14:48:00.000Z
    const updatedUser = await User.findByIdAndUpdate(
        { _id: req.user._id },
        { $set: req.body },
        { new: true, runValidators: true }
    )
    res.json(updatedUser)
};

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
