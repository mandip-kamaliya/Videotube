import mongoose  from "mongoose";
import {DB_NAME} from "../constants.js"

const connectdb=async()=>{
    try {
       const mongodbinstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("mongodb connected succesfully");
        
    } catch (error) {
        console.log("mongodb connection failled",error);
        

    }
} 
export default connectdb;