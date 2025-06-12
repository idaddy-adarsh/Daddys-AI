import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

function execute(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, {
      maxBuffer: 1024 * 1000 * 10
    }, function (error, stdout, stderr) {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

function isJson(text: string) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return false;
  }
}

export async function loadCookies() {
  const cookiePath = path.join(process.cwd(), 'cookie.txt');
  
  const command = `curl 'https://www.nseindia.com/' \
    -H 'authority: www.nseindia.com' \
    -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
    -H 'accept-encoding: gzip, deflate, br' \
    -H 'accept-language: en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7,hi;q=0.6,mr;q=0.5' \
    -H 'cache-control: no-cache' \
    -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' \
    --compressed --silent --output /dev/null --cookie-jar "${cookiePath}"`;

  try {
    await execute(command);
    return true;
  } catch (error) {
    
    return false;
  }
}

export async function getOptionChain(instrument: string) {
  const cookiePath = path.join(process.cwd(), 'cookie.txt');
  
  // Ensure cookie file exists
  try {
    await fs.access(cookiePath);
  } catch {
    await loadCookies();
  }

  const command = `curl 'https://www.nseindia.com/api/option-chain-indices?symbol=${instrument}' \
    -H 'authority: www.nseindia.com' \
    -H 'dnt: 1' \
    -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
    -H 'accept-encoding: gzip, deflate, br' \
    -H 'accept-language: en-IN,en;q=0.9,en-GB;q=0.8,en-US;q=0.7,hi;q=0.6,mr;q=0.5' \
    -H 'cache-control: no-cache' \
    -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' \
    --compressed --cookie "${cookiePath}" --cookie-jar "${cookiePath}"`;

  try {
    const response = await execute(command);
    const data = isJson(response);
    if (data) {
      return data;
    }
    throw new Error('Invalid JSON response');
  } catch (error) {
    
    // If error occurs, try refreshing cookies and retry once
    await loadCookies();
    const retryResponse = await execute(command);
    const data = isJson(retryResponse);
    if (data) {
      return data;
    }
    throw new Error('Failed to fetch option chain data');
  }
} 