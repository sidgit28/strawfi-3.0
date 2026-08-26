const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

async function parseFiling(req, res) {
  try {
    const { ticker, formType, year } = req.body;

    if (!ticker || !formType || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ticker, formType, and year'
      });
    }

    // Validate inputs
    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticker format. Must be 1-5 uppercase letters.'
      });
    }

    if (!['10-K', '10-Q', '8-K'].includes(formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type. Must be one of: 10-K, 10-Q, 8-K'
      });
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1993 || yearNum > currentYear) {
      return res.status(400).json({
        success: false,
        message: `Invalid year. Must be between 1993 and ${currentYear}`
      });
    }

    // Path to the Python script
    const scriptPath = path.join(__dirname, '..', 'sec_parser.py');

    // Spawn Python process with timeout
    const pythonProcess = spawn('python', [scriptPath, ticker, formType, year]);
    
    let result = '';
    let error = '';
    let timeoutId;

    // Set timeout for Python process
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script execution timed out after 5 minutes'));
      }, 5 * 60 * 1000); // 5 minutes timeout
    });

    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Handle process completion
    const processCompletion = new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${error}`));
        } else {
          resolve(result);
        }
      });
    });

    // Race between timeout and process completion
    const output = await Promise.race([processCompletion, timeout]);

    try {
      const parsedResult = JSON.parse(output);
      return res.status(200).json({
        success: true,
        data: parsedResult
      });
    } catch (parseError) {
      console.error('Error parsing Python script output:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Error parsing SEC filing results',
        error: parseError.message
      });
    }
  } catch (error) {
    console.error('Error in parseFiling:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

module.exports = { parseFiling }; 