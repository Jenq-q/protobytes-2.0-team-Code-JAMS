const db= require('../db')

exports.getUsers=async(req, res)=>{
    try{
        const {rows}=await db.query('select * from users')
        res.json(rows)
    }
    catch(error){
        console.log(error.message)

    }
}
exports.register=async(req, res)=>{
    try{
        console.log('validation passed')
    }
    catch(error){
        console.log(error.message)

    }
}