import { Router } from "express";
import collectionController from "../controllers/collectionController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { Role } from "../middleware/userMiddleware.js";

const router = Router();

// Public routes
router.get("/", collectionController.getAllCollections);
router.get("/:slug", collectionController.getCollectionBySlug);

// Admin routes
router.post(
  "/",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  collectionController.createCollection
);

router.put(
  "/:id",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  collectionController.updateCollection
);

router.delete(
  "/:id",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  collectionController.deleteCollection
);

router.post(
  "/product",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  collectionController.addProductToCollection
);

router.delete(
  "/:collectionId/product/:productId",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  collectionController.removeProductFromCollection
);

export default router;
