import { Router } from "express";
import sportController from "../controllers/sportController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.get("/", errorHandler(sportController.getAllSports.bind(sportController)));
router.post("/", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(sportController.createSport.bind(sportController)));
router.delete("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(sportController.deleteSport.bind(sportController)));

export default router;
