import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"


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
export {registeruser}