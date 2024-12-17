import {DataStructure, Track, usefulTrack, TrackMap, genres, moods, Hit} from '@shared/music.js';
import fetch from 'node-fetch';


export function processTrackJSON(raw_tracks : DataStructure){
  let processed_arr = [];
  let tracks: Track[] = convertMapToArray(raw_tracks.entities.tracks, raw_tracks.meta.hits);
  
  for(let track of tracks){
      let new_track = transformTrack(track);
      processed_arr.push(new_track);
  }

  return processed_arr;
}

/**
 * Convert track from old to new 
 */
export function transformTrack(oldTrack: Track): usefulTrack {
  const newTrack: usefulTrack = {
    id: oldTrack.id,
    length: oldTrack.length,
    durationMs: oldTrack.durationMs,
    bpm: oldTrack.bpm,
    energyLevel: oldTrack.energyLevel,
    stems: oldTrack.stems,
    segmentGroups: oldTrack.segmentGroups,
  };
  return newTrack;
}

export function convertMapToArray(trackMap: TrackMap, hits: Hit[]): Track[] {
 return hits.map(hit => trackMap[hit.trackId]);
}

export async function fetchTracks(genre:string, mood:string) : Promise<usefulTrack[]> {
  console.log(`fetchTracks: ${genre}, ${mood}`);
  let result = await fetchEpidemicTracks(genre,mood);
  if(result.length == 0 || result == undefined){
    console.log(`fetchTracks: no result, trying default mood`);
    result = await fetchEpidemicTracks(genre,"");
  }
  // if result is 0 again
  if(result.length == 0 || result == undefined){
    console.log(`fetchTracks: no result, trying default genre`);
    result = await fetchEpidemicTracks("",mood);
  }

  return result;
}

/**
 * 
 * @param genre 
 * @param mood 
 * @returns 
 * 
 * example:
 *   fetchTracks("trap","").then((res : Track[])=>{
    let track = res[0];
    let outputPath = `./music/${track.id}.mp3`; // Replace with your desired local output file name
    let url = track.stems.full.lqMp3Url
    // console.log(JSON.stringify(track));
    downloadFile(url, outputPath).catch((err) => {
        console.error(err);
    });
  })
 */
export async function fetchEpidemicTracks(genre:string, mood:string) : Promise<usefulTrack[]> {
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
        if(genre != "" && genres.includes(genre)){
            search += `&genres=${encodeURI(genre)}`;
        }
        if(mood != "" && moods.includes(mood)){
            search += `&moods=${encodeURI(mood)}`;
        }
        // console.log(search);
        const response = await fetch(`https://www.epidemicsound.com/json/search/tracks/${search}`, requestOptions as any);
        const result = await response.json() as DataStructure;
        return processTrackJSON(result);
    } catch (error) {
        console.error(error);
        return [];
    }
  }
  
/**
 * 
 * example:
 * fetchSFX("water rushing through a stream").then((res : Track[])=>{
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
 export async function fetchEpidemicSFX(query:string) {
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
      const result = await response.json() as DataStructure;
      // console.log(result);
      return processTrackJSON(result);
    } catch (error) {
      console.error('Error fetching SFX:', error);
      throw error;
    }
  }
