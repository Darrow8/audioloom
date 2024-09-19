import * as fs from "fs";
import path from "path";
import { PassThrough, Readable, pipeline } from 'stream';
import { TEMP_DATA_PATH } from './init';

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
        'logs'
    ];

    let tempDataPath = TEMP_DATA_PATH;

    requiredFolders.forEach(folder => {
        const folderPath = path.join(tempDataPath, folder);
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
