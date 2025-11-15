import { NextResponse } from "next/server";
import { verifyToken } from "./auth";

//TypeScript interface for JWT payload
export interface JWTPayload{
    id:string;
    role:string;
    iat:number;
    exp:number;
}

export function requireAuth(req:Request): JWTPayload | NextResponse{
    //Step 1:Extract Authorization header
    const authHeader =req.headers.get("authorization") || "";

    //step 2:Check if Bearer token exists
    if(!authHeader.startsWith('Bearer ')){
        return NextResponse.json(
            {error:"Unauthorized - No token provided"},
            {status:401}
        );
    }

}