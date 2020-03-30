const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const postController = require("../controllers/postController");

const router = express.Router();

/* Error handler for async / await functions */
const catchErrors = fn => {
  return function (req, res, next) {
    return fn(req, res, next).catch(next);
  };
};

/**
 * AUTH ROUTES: /api/auth
 */
router.post(
  "/api/auth/signup",
  authController.validateSignup,
  catchErrors(authController.signup)
);
router.post("/api/auth/signin", authController.signin);
router.get("/api/auth/signout", authController.signout);

/**
 * USER ROUTES: /api/users
 */
// param으로 userId가 활용되는 경우가 많아(users, profile, feed...) 
// 해당 함수를 체인화 하지 않고 미들웨어로 사용하여, req에 flag를 만들어 활용함
router.param("userId", userController.getUserById);

// 동일 route로 들어온 get, put, delete 요청을 각각의 middleware에서 처리한다.
// ex) 같은 경로(/api/users/:userId) get 요청은 유저정보 반환, delete는 해당 유저 삭제 등
router
  .route("/api/users/:userId")
  .get(userController.getAuthUser)
  .put(
    authController.checkAuth,
    userController.uploadAvatar,
    catchErrors(userController.resizeAvatar),
    catchErrors(userController.updateUser)
  )
  .delete(authController.checkAuth, catchErrors(userController.deleteUser));

router.get("/api/users", userController.getUsers);
router.get(
  "/api/users/profile/:userId",
  catchErrors(userController.getUserProfile)
);
router.get(
  "/api/users/feed/:userId",
  authController.checkAuth,
  catchErrors(userController.getUserFeed)
);

router.put(
  "/api/users/follow",
  authController.checkAuth,
  catchErrors(userController.addFollowing),
  catchErrors(userController.addFollower)
);
router.put(
  "/api/users/unfollow",
  authController.checkAuth,
  catchErrors(userController.deleteFollowing),
  catchErrors(userController.deleteFollower)
);

/**
 * POST ROUTES: /api/posts
 */
router.param("postId", postController.getPostById);

router.put(
  "/api/posts/like",
  authController.checkAuth,
  catchErrors(postController.toggleLike)
);
router.put(
  "/api/posts/unlike",
  authController.checkAuth,
  catchErrors(postController.toggleLike)
);

router.put(
  "/api/posts/comment",
  authController.checkAuth,
  catchErrors(postController.toggleComment)
);
router.put(
  "/api/posts/uncomment",
  authController.checkAuth,
  catchErrors(postController.toggleComment)
);

router.delete(
  "/api/posts/:postId",
  authController.checkAuth,
  catchErrors(postController.deletePost)
);

router.post(
  "/api/posts/new/:userId",
  authController.checkAuth,
  postController.uploadImage,
  catchErrors(postController.resizeImage),
  catchErrors(postController.addPost)
);
router.get("/api/posts/by/:userId", catchErrors(postController.getPostsByUser));
router.get("/api/posts/feed/:userId", catchErrors(postController.getPostFeed));

module.exports = router;
