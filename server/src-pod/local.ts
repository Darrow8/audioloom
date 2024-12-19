import * as fs from "fs";
import path from "path";
import { PassThrough, Readable, pipeline } from 'stream';
import { TEMP_DATA_PATH } from '@pod/init.js';
import { Clip, Line } from "@shared/line.js";
import { Script } from "@shared/script.js";


export async function saveClipToLogs(data: Clip, fileName: string){
    // Ensure the folder exists
    let folderPath = path.join(TEMP_DATA_PATH, 'logs');
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Create the full file path
    const filePath = path.join(folderPath, `${fileName}.json`);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        await addToJsonArray(filePath, data);
        console.log(`Data appended to existing file: ${filePath}`);
    } else{
        await saveAsJson([data], folderPath, fileName);
    }
}


/**
 * Saves an array of objects as a JSON file in the specified folder.
 * @param data - Array of objects to be saved.
 * @param folderPath - Path to the folder where the JSON file will be saved.
 * @param fileName - Name of the JSON file.
 */
export async function saveAsJson(data: any[], folderPath: string, fileName: string): Promise<void> {
    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Create the full file path
    const filePath = `${folderPath}/${fileName}.json`;

    // Convert data to formatted JSON string
    const jsonData = JSON.stringify(data, null, 2);

    // Write formatted JSON data to file
    await fs.promises.writeFile(filePath, jsonData, 'utf-8');

    console.log(`Formatted data saved to ${filePath}`);
}

/**
 * Adds a new object to a JSON array stored in a local file.
 * If the file doesn't exist, it creates a new file with the object in an array.
 * 
 * @param {string} filePath - The path to the JSON file.
 * @param {any} newObject - The new object to be added to the array.
 * @returns {Promise<void>}
 */
export async function addToJsonArray(filePath: string, newObject: any): Promise<void> {
    try {
        let jsonArray: any[] = [];

        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Read the existing file
            const fileContent = await fs.promises.readFile(filePath, 'utf-8');
            jsonArray = JSON.parse(fileContent);

            // Ensure the content is an array
            if (!Array.isArray(jsonArray)) {
                throw new Error('The file content is not a JSON array');
            }
        }

        // Add the new object to the array
        jsonArray.push(newObject);

        // Write the updated array back to the file
        await fs.promises.writeFile(filePath, JSON.stringify(jsonArray, null, 2), 'utf-8');

        console.log(`Object added to ${filePath}`);
    } catch (error) {
        console.error(`Error adding object to JSON array: ${error}`);
        throw error;
    }
}


/**
 * Saves a Readable stream to a file.
 * 
 * @param {Readable} inputStream - The Readable stream to be saved.
 * @param {string} outputFile - The file path where the stream should be saved.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * 
 * @example
 * const readableStream = someReadableStreamFunction();
 * saveStreamToFile(readableStream, 'output.txt')
 *   .then(() => console.log('Stream saved successfully'))
 *   .catch(err => console.error('Error saving stream:', err));
 */
export async function saveStreamToFile(inputStream: Readable, outputFile: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputFile);
  
      pipeline(inputStream, writeStream, (err) => {
        if (err) {
          console.log(err);
          reject();
        } else {
          console.log('saved!', outputFile);
          resolve();
        }
      });
    });
  }

/**
 * Deletes all files from a given folder
 */
export function deleteAllFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Unable to scan directory: ${err}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);

            // Check if the file is read-only and change permissions if necessary
            fs.chmod(filePath, 0o666, (chmodErr) => {
                if (chmodErr) {
                    console.error(`Error changing permissions for file ${filePath}: ${chmodErr}`);
                    return;
                }

                // Delete the file
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Error deleting file ${filePath}: ${unlinkErr}`);
                    } else {
                        console.log(`Successfully deleted file ${filePath}`);
                    }
                });
            });
        });
    });
}


/**
 * Checks for required folders in /temp-data and creates them if they don't exist.
 */
export function ensureRequiredFolders(): void {
    const requiredFolders = [
        'character',
        'character-temp',
        'dialogue',
        'music',
        'music-temp',
        'result',
        'logs',
        'uploads'
    ];


    requiredFolders.forEach(folder => {
        const folderPath = path.join(TEMP_DATA_PATH, folder);
        if (!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`Created folder: ${folderPath}`);
            } catch (error) {
                console.error(`Error creating folder ${folderPath}:`, error);
            }
        }
    });
}

export async function saveScriptToLogs(data: Script, fileName: string) {
    // Ensure the folder exists
    let folderPath = path.join(TEMP_DATA_PATH, 'logs');
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Create the full file path
    const filePath = path.join(folderPath, `${fileName}.json`);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        await addToJsonArray(filePath, data);
        console.log(`Script appended to existing file: ${filePath}`);
    } else {
        await saveAsJson([data], folderPath, fileName);
    }
}
