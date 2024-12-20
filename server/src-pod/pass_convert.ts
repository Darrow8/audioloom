import fetch from "node-fetch";
import FormData from "form-data";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Multer } from "multer";
import { ConvertAPI } from 'convertapi';

export async function convertToTXT(file: Express.Multer.File, save_path: string): Promise<{ path: string, updated_file: any }> {
  const convertapi = new ConvertAPI(process.env.CONVERT_API_SECRET);

  let result = await convertapi.convert('txt', { File: file.path }).catch((error) => {
    console.log('Error converting file: ' + error);
    return {
      file: null
    };
  });
  // get converted file url
  console.log("Converted file url: " + result.file.url);

  // save to file
  let primitive_name = file.originalname.split('.')[0];
  let file_path = `${save_path}/${primitive_name}.txt`;
  let updated_file = await result.file.save(file_path);
  console.log("File saved: " + file);
  return {
    path: file_path,
    updated_file: updated_file
  };
}