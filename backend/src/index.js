require("dotenv").config();
const express=require('express')
const app = express()
const{PORT}=require('./constants')

app.use(express.json())
//import routes
const authRoutes= require('./routes/auth')

//initialize routes
app.use('/api',authRoutes)

const appStart =()=>{
    try{
        app.listen(PORT, ()=>{
            console.log(`this is workingggggg or notttt aaaa at http://localhost:${PORT}`)
        })
    }
    catch(error){
        console.log(`Error:${error.message}`);
    }
}

appStart()