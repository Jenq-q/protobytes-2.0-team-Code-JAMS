const {Router}=require('express')
const { register}=require('../controllers/auth')
const {registerValidation}=require('../validators/auth')
const {validationMiddleware } = require('../middlewares/validations-middleware')
const router =Router()

// router.get('/get-users', getUsers)
router.post('/register', registerValidation, validationMiddleware, register)

module.exports= router 