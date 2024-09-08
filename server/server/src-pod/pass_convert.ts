import fetch from "node-fetch";
import FormData from "form-data";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Multer } from "multer";
import { ConvertAPI } from 'convertapi';


export async function convertToTXT(file: Express.Multer.File, save_path: string): Promise<Express.Multer.File> {
  const convertapi = new ConvertAPI(process.env.CONVERT_API_SECRET);

  return await convertapi.convert('txt', { File: file.path })
    .then(function(result) {
      // get converted file url
      console.log("Converted file url: " + result.file.url);
  
      // save to file
      let primitive_name = file.originalname.split('.')[0];
      const file_path = `${save_path}/${primitive_name}.txt`;
      return result.file.save(file_path);
    })
    .then(function(file) {
      console.log("File saved: " + file);
      return file;
    })
    .catch(function(e) {
      console.error(e.toString());
      return null;
    });


}