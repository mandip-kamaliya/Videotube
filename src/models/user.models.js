import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema=new Schema({
   username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true
   },
   email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
   },
   fullname:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true
   },
   avatar:{
    type:String, //claudinary url
    required:true
   },
   coverimage:{
    type:String, //claudinary url
    required:true
   },
   watchhistory:[{
    type:Schema.Types.ObjectId,
    ref:"Video"
   }],
   password:{
    type:String,
    required:true
   },
   refreshtoken:{
    type:String
   }
},{
    timestamps:true
})
userSchema.pre("save",async function(next){
    if(!this.modified("password")) return next();
    this.password=bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPassword=async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
    //short lived access token
    jwt.sign({ 
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname

     }, process.env.ACCESS_TOKEN_SECKRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    }
     userSchema.methods.generateRefreshToken=function(){
        //short lived access token
        jwt.sign({ 
            _id:this._id,
            
    
         }, process.env.REFRESH_TOKEN_SECKRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
}
export const User=mongoose.model("User",userSchema)