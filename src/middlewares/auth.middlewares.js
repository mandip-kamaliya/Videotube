import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import { User } from "../models/user.models"


export const verifyJWT= asyncHandler(async(req,_,next)=>{
    try {
        const token= req.cookie.Acccesstoken || req.header("Authorization").replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
        const decodedtoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECKRET)
        const user=User.findById(decodedtoken?._id).select("-password refreshtoken")
        if(!user){
            throw new ApiError(404,"Invalid access token")
        }
        req.user=user
        next()

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})