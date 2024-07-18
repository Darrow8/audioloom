import * as epidemic from './epidemic_resources';

async function fetchTracks(genre:string, mood:string) : Promise<epidemic.usefulTrack[]> {
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
      
    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };
    try {
        let search = `?order=desc&page=1&segment_types=music-structure&sort=date&vocals=false`;
        if(genre != "" && epidemic.genres.includes(genre)){
            search += `&genres=${encodeURI(genre)}`;
        }
        if(mood != "" && epidemic.moods.includes(mood)){
            search += `&moods=${encodeURI(mood)}`;
        }
        console.log(search);
        const response = await fetch(`https://www.epidemicsound.com/json/search/tracks/${search}`, requestOptions);
        const result = await response.json() as epidemic.DataStructure;
        return processTrackJSON(result);
    } catch (error) {
        console.error(error);
        return [];
    }
  }

  function convertMapToArray(tracks: { [key: string]: epidemic.Track }): epidemic.Track[] {
    let arr = Object.values(tracks);
    arr = arr.sort((a,b) => a.id - b.id);
    return arr;
  }

  function processTrackJSON(raw_tracks : epidemic.DataStructure){
    let processed_arr = [];
    let tracks: epidemic.Track[] = convertMapToArray(raw_tracks.entities.tracks);
    
    for(let track of tracks){
        let new_track = transformTrack(track);
        processed_arr.push(new_track);
    }

    return processed_arr;
  }

  function transformTrack(oldTrack: epidemic.Track): epidemic.usefulTrack {
  const newTrack: epidemic.usefulTrack = {
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

//   fetchTracks("punk rock","angry").then((res)=>{
//     console.log(JSON.stringify(res));
//   })