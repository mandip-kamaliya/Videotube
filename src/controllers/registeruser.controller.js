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
const refreshAccessToken=asyncHandler(async(req,res)=>{
      const incomingrefreshtoken=req.cookie.refreshtoken || req.body.refreshtoken
      if(!incomingrefreshtoken){
        throw new ApiError(401,"unothorized user")
      }
      try {
        const decodeduser=jwt.verify(
          incomingrefreshtoken,
          process.env.REFRESH_TOKEN_SECKRET
        )
        const user=await User.findById(decodeduser?._id)
        if(!user){
          throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingrefreshtoken!==user?.refreshtoken){
          throw new ApiError(401,"Invalid refresh token")
        }
        const options={
          httpOnly:true,
          secure:process.env.NODE_ENV === "production"
        }
        const {Accesstoken,refreshtoken:Newrefreshtoken}=await GenerateAccessandRefreshtokens(user?._id)
        
        return res
        .status(200)
        .cookie("Accesstoken",Accesstoken,options)
        .cookie("refreshtoken",Newrefreshtoken,options)
        .json(
          new ApiResponse(200,{Accesstoken,refreshtoken:Newrefreshtoken},"Access token refreshed successfully")
        )
      } catch (error) {
        throw new ApiError(500,"Something went wrogn while refreshing access token")
      }

})
const logout=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refreshtoken:undefined
        }
      },
        {
          new:true
        }    
  )
  const options={
    httpOnly:true,
    secure:process.env.NODE_ENV === "production"
  }
  return res.status(200)
  .clearcookie("Accesstoken",Accesstoken,options)
  .clearcookie("refreshtoken",refreshtoken,options)
  .json( new ApiResponse(200,"user logout successfully!"))
})
const changecurrentpassword=asyncHandler(async(req,res)=>{
  const {oldpasssword,newpassword}=req.body
  const user=await User.findById(req.user?._id)
  if(!user){
    throw new ApiError(404,"user not found")
  }
  const passwordvalid=await ispassword(oldpasssword)
  if(!passwordvalid){
    throw new ApiError(400,"password is incorect")
  }
  user.password=newpassword
  await user.save({validateBeforeSave:false})
  return res.status(200).json(new ApiResponse(200,{},"password change succesfully!"))

})
const getCurrentuser=asyncHandler(async(req,res)=>{
  return res.status(200).json(new ApiResponse(200,req.user,"current user details"))
})
const updateUserDetails=asyncHandler(async(rwq,res)=>{
  const {fullname,email}=req.body
  if(!fullname || !email){
    throw new ApiError(401,"fullname and email are required")
  }
  const user=await User.findById(req.user?._id)
  User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        fullname,
        email:email.toLowercase()
      }
    },  
    {new:true}
  ).select("-password -refreshtoken")
  return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateavatar=asyncHandler(async(req,res)=>{
  const {avatarlocalpath}=req.file?.path
  if(!avatarlocalpath){
    throw new ApiError(401,"file is required")
  }
  const avatar=await uploadoncloudinary(avatarlocalpath)
  if(!avatar.url){
    throw new ApiError(404,"something went wrogn while uploading in claudinary")
  }
  const user=User.findByIdAndUpdate(
    req.user?._id,{
      $set:{
        avatar:avatar.url
      }
    },{new:true}
  ).select("-password -refreshtoken")
  return res.status(200).json(new ApiResponse(200,{},"update avatar successfully"))
  
})
const updatecoverimage=asyncHandler(async(req,res)=>{
  const {coverimagelocalpath}=req.file?.path
  if(!coverimagelocalpath){
    throw new ApiError(404,"file is required")
  }
  const coverimage=await uploadoncloudinary(coverimagelocalpath)
  if(!coverimage.url){
    throw new ApiError(404,)
  }
 const user= User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverimage:coverimage.url()
      }
    },{new:true}
  ).select("-password -refreshtoken")
  return res.status(200).json(new ApiResponse(200,{},"update cover image successfully"))

})
export {
  registeruser,
  loginuser,
  logout,
  GenerateAccessandRefreshtokens,
  refreshAccessToken
}