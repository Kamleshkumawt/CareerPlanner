import { NextFunction, Request, Response } from "express";

interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message: string }>;
}

const errorHandler = (err: CustomError, req:Request, res:Response, next:NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Mongoose bad Object Key
    if(err.name === 'CastError') {
        message = "Resource not found";
        statusCode = 400;
    }

    // Mongoose duplicate key
    if(err.code === 11000 && err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
        statusCode = 400;
    }

    // Mongoose Validation error
    if(err.name === 'ValidationError' && err.errors) {
        message = Object.values(err.errors).map((error) => error.message).join(', ');
        statusCode = 401;
    }

    //JWT errors
    if(err.name === 'JsonWebTokenError') {
        message = "Invalid token";
        statusCode = 401;
    }

    if(err.name === 'TokenExpiredError') {
        message = "Token expired";
        statusCode = 401;
    }

    console.log('Error: ', {
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    res.status(statusCode).json({
        success: false,
        message: message,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
    });
};

export default errorHandler;