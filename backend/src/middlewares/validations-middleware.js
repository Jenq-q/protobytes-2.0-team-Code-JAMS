const {validationResult}=require('express-validator')

exports.validationMiddleware=(req, res, next)=>{
    let error = validationResult(req)
    console.log('Request body:', req.body)
    console.log('Validation errors:', error.array())

    if(!error.isEmpty()){
        return res.status(400).json({
            errors: error.array(),
        })
    }
    next()
}