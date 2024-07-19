import * as epidemic from './epidemic_utils';
import fetch from 'node-fetch';
import fs from 'fs';

/**
 * 
 * @param genre 
 * @param mood 
 * @returns 
 * 
 * example:
 *   fetchTracks("trap","").then((res : epidemic.Track[])=>{
    let track = res[0];
    let outputPath = `./music/${track.id}.mp3`; // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url
    // console.log(JSON.stringify(track));
    downloadFile(url, outputPath).catch((err) => {
        console.error(err);
    });
  })
 */
export async function fetchTracks(genre:string, mood:string) : Promise<epidemic.usefulTrack[]> {
    const myHeaders = {
        "host": "www.epidemicsound.com",
        "Accept": "application/json",
        // "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
        // "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "App-Version": "v2024.07.18-rel3",
        "Content-Type": "application/json",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua-mobile": "?0",
        // "sec-ch-ua-platform": "\"macOS\"",
        // "Cookie": "client_session_id=792e1b06-18c8-4b35-a63e-e64f0294fb4e; sp=3b1f23ac-da00-4dbe-8db7-d67c8646c6dd; sessionid=1a43prj3mv33980mzoce765digr8whyo"
      };
      
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };
    try {
        let search = `?order=desc&page=1&limit=10&segment_types=music-structure&sort=date`;
        if(genre != "" && epidemic.genres.includes(genre)){
            search += `&genres=${encodeURI(genre)}`;
        }
        if(mood != "" && epidemic.moods.includes(mood)){
            search += `&moods=${encodeURI(mood)}`;
        }
        console.log(search);
        const response = await fetch(`https://www.epidemicsound.com/json/search/tracks/${search}`, requestOptions as any);
        const result = await response.json() as epidemic.DataStructure;
        return epidemic.processTrackJSON(result);
    } catch (error) {
        console.error(error);
        return [];
    }
  }
/**
 * 
 * example:
 * fetchSFX("water rushing through a stream").then((res : epidemic.Track[])=>{
  console.log(JSON.stringify(res));

    let track = res[0];
    let outputPath = `./music/${track.id}.mp3`; // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url
    console.log(JSON.stringify(track));
    downloadFile(url, outputPath).catch((err) => {
        console.error(err);
    });    
})
 */
 export async function fetchSFX(query:string) {
    const url = `https://www.epidemicsound.com/json/search/sfx/?sort=relevance&limit=10&page=1&term=${encodeURI(query)}`;
    const headers = {
      'host': 'www.epidemicsound.com',
      'Accept': 'application/json',
      // 'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'App-Version': 'v2024.07.18-rel3',
      'X-CSRFToken': 'ld6H0qY763JT86axSKvZ8VQgOaX2AEJ8',
      'Content-Type': 'application/json',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      // 'Cookie': 'FPAU=1.2.1939848471.1721337114; FPGSID=1.1721337113.1721337113.G-7XDDGX4GBV.z69c092PH0sagrZ-J3H0wQ; FPID=FPID2.2.SuDcEpjug8Hr38YcJOOjoO4KXTMUHmFz492zluq1jhk%3D.1719858808; client_session_id=792e1b06-18c8-4b35-a63e-e64f0294fb4e; sp=3b1f23ac-da00-4dbe-8db7-d67c8646c6dd; sessionid=1a43prj3mv33980mzoce765digr8whyo'
    };
  
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json() as epidemic.DataStructure;
      console.log(result);
      return epidemic.processTrackJSON(result);
    } catch (error) {
      console.error('Error fetching SFX:', error);
      throw error;
    }
  }
  
export async function downloadFile(url:string, outputPath:string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error downloading file: ${response.statusText}`);
    }
    const fileStream = fs.createWriteStream(outputPath);
    response.body.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Download ${outputPath} completed!`);
    });

    fileStream.on('error', (err) => {
        console.error(`Error writing to file: ${err.message}`);
    });
}