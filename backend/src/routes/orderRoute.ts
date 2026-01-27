import { Router } from "express";
import orderController from "../controllers/orderController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.post("/", userMiddleware.isUserLoggedIn, errorHandler(orderController.createOrder.bind(orderController)));
router.get("/", userMiddleware.isUserLoggedIn, errorHandler(orderController.getOrders.bind(orderController)));
router.get("/:id", userMiddleware.isUserLoggedIn, errorHandler(orderController.getOrderById.bind(orderController)));

export default router;

