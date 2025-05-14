import { Router } from "express"
const router = Router()
import { getAllItems, populateHandler, purchase } from "../controllers/controller"

router.get("/getAllitems", getAllItems)
router.get('/populate', populateHandler)
// Order
router.post('/purchase', purchase)

export default router;