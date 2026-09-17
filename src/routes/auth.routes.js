import { Router } from "express";
import userModel from "../models/user.model.js";
import { generateTokens, verifyAccessToken, verifyRefreshToken} from "../utils/auth.js";
import bcrypt from "bcryptjs";

const router = Router();


router.post("/register", async(req,res) => {

    const {name,email,password} = req.body;

    const isUserExists = await userModel.findOne({
        email
    })

    if(isUserExists){
        return res.status(400).json({
            message:"User already exists",
            errors:
            {
                field: "email",  // either we write field or path
                message:"User already exists"
            }
        })
    }

    const user = await userModel.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password,12)
    })

    const { accessToken, refreshToken} = generateTokens({ userId: user._id})

    user.refreshToken = refreshToken
    await user.save()

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,          // notes
    })

    res.status(201).json({
        message: "User registered successfully",
        data:{
            user: {
                name: user.name,
                email: user.email
            }
        },
        accessToken
    })
})


// get ---> /api/auth/me

router.get("/me", async(req,res) => {

    const accessToken = req.headers.authorization?.split(" ")[1]

    try{
        const decoded = verifyAccessToken(accessToken)

        const user = await userModel.findById(decoded.id)
        // we will find the user from the token id and then we will send a res

        res.status(200).json({
            message: "user fetched successfully",
            data: {
                user: {
                    name: user.name,
                    email: user.email
                }
            }
        })
    } catch(err){
        return res.status(401).json({
            message:"Unauthorized, Invalid or expired access token",
        })
    }
})


// post ---> /api/auth/refresh

router.post("/refresh" , async (req,res) => {

    const refreshToken = req.cookies.refreshToken

    if(!refreshToken){
        return res.status(401).json({
            message: "Unauthorized, refresh token not found",
        })
    }

    try{

        const decoded = await verifyRefreshToken(refreshToken)

        const user = await userModel.findById(decoded.id)

        if(refreshToken !== user.refreshToken){

            user.refreshToken = null
            await user.save()

            return res.status(401).json({
                message: "Unauthorized, refresh token mismatched",
            })
        }

        const {accessToken, refreshToken: newRefreshToken} = generateTokens({userId: user._id})

        res.cookie("refreshToken", newRefreshToken , { httpOnly: true})

        user.refreshToken = newRefreshToken
        await user.save()

        res.status(200).json({
            message: "Tokens refreshed sucessfully",
            accessToken
        })

    }catch (err){
        return res.status(401).json({
            message: "Unauthorized, Invalid or expired refresh token",
        })
    }
})


// post ---> /api/auth/login

router.post("/login", async (req, res) => {
    
    const { email, password } = req.body

    const user = await userModel.findOne({
        email
    })
    
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.passwordHash
    )

    if (!isPasswordCorrect) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const { accessToken, refreshToken } = generateTokens({
        userId: user._id
    })
    
    user.refreshToken = refreshToken
    await user.save()

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true
    })

    res.status(200).json({
        message: "Login successful",
        data: {
            user: {
                name: user.name,
                email: user.email
            }
        },
        accessToken
    })
})


export default router

