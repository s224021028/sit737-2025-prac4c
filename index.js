// Import required packages
const express = require("express")
const winston = require("winston")

/*
Configure Winston logger with three transports:
1. Console: For development visibility (all levels)
2. Error log file: For storing error messages only
3. Combined log file: For storing all non-error messages
*/
const logger = winston.createLogger({ 
    level: "info", 
    format: winston.format.json(), 
    defaultMeta: { service: "calculator-microservice" }, 
    transports: [
        // Console logging with simple formatting
        new winston.transports.Console({ 
            format: winston.format.simple(), 
        }),
        // Error log file - only logs error level messages
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        // Combined log file - excludes error messages using custom formatter
        new winston.transports.File({ filename: "logs/combined.log", format: winston.format.combine(winston.format((info) => {
              if (info.level === "error") {
                return false
              }
              return info
            })(),
            winston.format.json()
          ) 
        }), 
    ], 
});

/**
Error handling function that validates inputs and checks for common error cases

@param {string} operator - The arithmetic operator ("+", "-", "*", "/")
@param {number} num1 - The first operand
@param {number} num2 - The second operand
@returns {number} Error code: 0=no error, 1=invalid number, 2=division by zero, 3=number too large/small
*/
function handleErrors(operator, num1, num2) 
{
    // Check if inputs are valid numbers
    if (isNaN(num1) || isNaN(num2))
    {
        logger.error("Invalid input: Input parameters are not numbers")
        return 1
    }
    // Check for division by zero
    else if (operator == "/" || operator == "%" && num2 == 0)
    {
        logger.error("Zero division: Division by 0 is not possible")
        return 2
    }
    // Check if numbers exceed JavaScript's safe number range
    else if (num1 > Number.MAX_SAFE_INTEGER || num1 < Number.MIN_SAFE_INTEGER || num2 > Number.MAX_SAFE_INTEGER || num2 < Number.MIN_SAFE_INTEGER)
    {
        logger.error("Range exceeded: Input parameters have exceeded min/max range limits")
        return 3
    }
    else if (operator == "^")
    {
        // Convert number to string for comparision
        n2 = num2.toString()
        // Check if base is negative and exponent is a fraction using regex
        if(num1 < 0 && /\d+\.\d+/.test(n2))
        {
            logger.error("Negative exponential error: Base is negative and exponent is a fraction")
            return 4
        }
        // Check if base is 0 and exponent is a negative fraction using regex
        if(num1 == 0 && n2 < 0 && /\d+\.\d+/.test(n2))
        {
            logger.error("Zero exponential error: Base is 0 and exponent is a negative fraction")
            return 5
        }
    }
    else if (operator == "sqrt")
    {
        // Check if input number is negative
        if (num1 < 0)
        {
            logger.error("Negative square root: Input number is negative")
            return 6
        }
    }
    // No errors detected
    else
        return 0
}

// Initialize Express application
const app = express()

/*
Addition endpoint - Adds two numbers
URL: /add?num1=x&num2=y
*/
app.get("/add", (req, res) => {
    // Extract and parse query parameters
    var num1 = req.query.num1
    var num2 = req.query.num2
    num1 = parseFloat(num1)
    num2 = parseFloat(num2)
    // Handle validation errors
    const validate = handleErrors("+", num1, num2)
    if (validate == 1)
        return res.status(400).json({message: "num1 and num2 must be numbers"})
    else if (validate == 3)
        return res.status(400).json({message: "Either numbers are too large or too small"})
    else
    {
        // Perform addition and log the operation
        const result = num1 + num2
        logger.info(`Addition: ${num1} + ${num2} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

/*
Subtraction endpoint - Subtracts second number from first
URL: /sub?num1=x&num2=y
*/
app.get("/sub", (req, res) => {
    // Extract and parse query parameters
    var num1 = req.query.num1
    var num2 = req.query.num2
    num1 = parseFloat(num1)
    num2 = parseFloat(num2)
    // Handle validation errors
    const validate = handleErrors("-", num1, num2)
    if (validate == 1)
        return res.status(400).json({message: "num1 and num2 must be numbers"})
    else if (validate == 3)
        return res.status(400).json({message: "Either numbers are too large or too small"})
    else
    {
        // Perform subtraction and log the operation
        const result = num1 - num2
        logger.info(`Subtraction: ${num1} - ${num2} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

/*
Multiplication endpoint - Multiplies two numbers
URL: /mul?num1=x&num2=y
*/
app.get("/mul", (req, res) => {
    // Extract and parse query parameters
    var num1 = req.query.num1
    var num2 = req.query.num2
    num1 = parseFloat(num1)
    num2 = parseFloat(num2)
    // Handle validation errors
    const validate = handleErrors("*", num1, num2)
    if (validate == 1)
        return res.status(400).json({message: "num1 and num2 must be numbers"})
    else if (validate == 3)
        return res.status(400).json({message: "Either numbers are too large or too small"})
    else
    {
        // Perform multiplication and log the operation
        const result = num1 * num2
        logger.info(`Multiplication: ${num1} * ${num2} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

/*
Division endpoint - Divides first number by second
URL: /div?num1=x&num2=y
*/
app.get("/div", (req, res) => {
    // Extract and parse query parameters
    var num1 = req.query.num1
    var num2 = req.query.num2
    num1 = parseFloat(num1)
    num2 = parseFloat(num2)
    // Handle validation errors
    const validate = handleErrors("/", num1, num2)
    if (validate == 1)
        return res.status(400).json({message: "num1 and num2 must be numbers"})
    else if (validate == 2)
        return res.status(400).json({message: "Denominator cannot be 0 in division"})
    else if (validate == 3)
        return res.status(400).json({message: "Either numbers are too large or too small"})
    else
    {
        // Perform division and log the operation
        const result = num1 / num2
        logger.info(`Division: ${num1} / ${num2} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

/*
Exponent endpoint - Calculates the value of Base to the power of Exponent
URL: /exp?num1=x&num2=y
*/
app.get("/exp", (req, res) => {
    var num1 = req.query.num1
    var num2 = req.query.num2
    num1 = parseFloat(num1)
    num2 = parseFloat(num2)
    // Handle validation errors
    const validate = handleErrors("^", num1, num2)
    if (validate == 1)
        return res.status(400).json({message: "num1 and num2 must be numbers"})
    else if (validate == 3)
        return res.status(400).json({message: "Either numbers are too large or too small"})
    else if (validate == 4)
        return res.status(400).json({message: "If base is negative, exponent cannot be a fraction"})
    else if (validate == 5)
        return res.status(400).json({message: "If base is 0, exponent cannot be a negative fraction"})
    else
    {
        // Perform exponent and log the operation
        const result = Math.pow(num1, num2)
        logger.info(`Exponent: ${num1} ^ ${num2} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

/*
Square root endpoint - Returns the Square root of the number
URL: /sqrt?num1=x
*/
app.get("/sqrt", (req, res) => {
    var num1 = req.query.num1
    num1 = parseFloat(num1)
    // Handle validation errors
    const validate = handleErrors("sqrt", num1, 0)
    if (validate == 1)
        return res.status(400).json({message: "num1 must be a number"})
    else if (validate == 3)
        return res.status(400).json({message: "Numbers is too large or too small"})
    else if (validate == 6)
        return res.status(400).json({message: "Square root of negative numbers is not supported"})
    else
    {
        // Perform square root and log the operation
        const result = Math.sqrt(num1)
        logger.info(`Square root: ${num1} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

/*
Modulo endpoint - Divides first number by second and returns the reminder
URL: /mod?num1=x&num2=y
*/
app.get("/mod", (req, res) => {
    var num1 = req.query.num1
    var num2 = req.query.num2
    num1 = parseFloat(num1)
    num2 = parseFloat(num2)
    // Handle validation errors
    const validate = handleErrors("%", num1, num2)
    if (validate == 1)
        return res.status(400).json({message: "num1 and num2 must be numbers"})
    else if (validate == 2)
        return res.status(400).json({message: "Denominator cannot be 0 in modulo"})
    else if (validate == 3)
        return res.status(400).json({message: "Either numbers are too large or too small"})
    else
    {
        // Perform modulo and log the operation
        const result = num1 % num2
        logger.info(`Modulo: ${num1} % ${num2} = ${result}`)
        // Return result as JSON
        res.json({result})
    }
})

// Start the Express server on port 3000
app.listen(3000, () => {
    logger.info("Calculator microservice running on http://localhost:3000")
})