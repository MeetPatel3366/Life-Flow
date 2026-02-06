import express from "express"
import { validate } from "../middlewares/validate.middleware.js"
import { registerSchema } from "../validations/user.validation.js"
import { register } from "../controllers/user.controller.js"

const router=express.Router()

router.post("/register",validate({body: registerSchema}),register)

export default router;