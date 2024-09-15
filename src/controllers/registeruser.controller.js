import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const GenerateAccessandRefreshtokens=asyncHandler(async(userid)=>{
     try {
      const user=await User.findById(userid)
      if(!user){
        throw new ApiError(400,"user not found")
      }
       const Accesstoken=user.generateAccessToken()
       const refreshtoken=user.generateRefreshToken()
       user.refreshtoken=refreshtoken
       await  user.save({validateBeforeSave:false})
       return {Accesstoken,refreshtoken}
      
     } catch (error) {
        throw new ApiError(500,"something went wrong while generating tokens")
     }  
})
const registeruser=asyncHandler( async(req,res)=>{
    const {username,email,fullname,password}=req.body
if([username,email,fullname,password].some((field)=>field?.trim()=="")){
    throw new ApiError(400,"there is a empty field");
}
  const existeduser=User.findOne({
    $or:[{username},{email}]
  })
  if(existeduser){
    throw new ApiError(409,"user already exists")
  }
  const avatarlocalpath=req.file?.avatar[0].path;
  const coverimagelocalpath=req.file?.coverimage[0].path;

  if(!avatarlocalpath){
    throw new ApiError(400,"avatar is required")
  }
   const avatar=await uploadoncloudinary(avatarlocalpath);
   const coverimage=await uploadoncloudinary(coverimagelocalpath);

   
  if(!avatar){
    throw new ApiError(400,"avatar is required")
  }
  
  if(coverimage){
    throw new ApiError(400,"coverimage is required")
  }

  const user=User.create({
    fullname,
    email,
    password,
    avatar:avatar.url,
    coverimage:coverimage.url || "",
    username:username.toLowercase()
  })

  const createduser=await User.findById(user._id).select(
    "-password -refreshtoken"
  )

  if(!createduser){
    throw new ApiError(500,"something went wrogn while creating user");
  }
  return res.status(201).json(
     new ApiResponse(200,createduser,"user created successfully")
    )
})
const loginuser=asyncHandler(async(req,res)=>{
   const {username,email,password}=req.body
   if(!username && !email){
    throw new ApiError(400," usename or email is required")
   }
   const user=User.findOne({
    $or:[{username},{email}]
   })
  const ispasswordvalid= await user.isPassword(password)
  if(!ispasswordvalid){
    throw new ApiError(400,"Invalid credientials")
  }
  const {Accesstoken,refreshtoken}=await generateAccessToken(user._id)
  const loggedinuser=await User.findById(user._id).select("-password -refreshtken")
  if(!loggedinuser){
    throw new ApiError(404,"something went wrogn while login")
  }
  const options={
    httpOnly:true,
    secure:process.env.NODE_ENV==="production"
  }
  return res
  .status(200)
  .cookie("Accesstoken",Accesstoken,options)
  .cookie("refreshtoken",refreshtoken,options)
  .json( new ApiResponse(
    200,
    {user:loggedinuser,Accesstoken,refreshtoken},
    "user logged in successfully"
  ))
})
export {registeruser}