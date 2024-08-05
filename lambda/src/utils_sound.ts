
export function processTrackJSON(raw_tracks : DataStructure){
  let processed_arr = [];
  // console.log(JSON.stringify(raw_tracks.meta))
  let tracks: Track[] = convertMapToArray(raw_tracks.entities.tracks, raw_tracks.meta.hits);
  
  for(let track of tracks){
      let new_track = transformTrack(track);
      processed_arr.push(new_track);
  }

  return processed_arr;
}

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

interface TrackMap {
  [key: number]: Track;
}

export interface usefulTrack {
    id: number | string;
    length: number;
    durationMs: number;
    bpm: number;
    energyLevel: string;
    stems: {
      full: Stem;
      bass: Stem;
      drums: Stem;
      instruments: Stem;
      melody: Stem;
    };
    segmentGroups: SegmentGroup[];
}

interface TrackCreative {
    creativeType: string;
    name: string;
    slug: string;
  }
  
  interface Genre {
    tag: string;
    fatherTag: string;
    displayTag: string;
    slug: string;
  }
  
  interface Mood {
    tag: string;
    fatherTag: string;
    displayTag: string;
    slug: string;
  }
  
  interface Stem {
    stemType: string;
    s3TrackId: number;
    lqMp3Url: string;
    waveformUrl: string;
  }
  
  interface CoverArtSizes {
    XS: string;
    S: string;
    M: string;
    L: string;
  }
  
  interface CoverArt {
    baseUrl: string;
    sizes: CoverArtSizes;
  }
  
  export interface Segment {
    startTime: number;
    duration: number;
  }
  
  interface SegmentGroup {
    type: string;
    version: string;
    segments: Segment[];
  }
  
  export interface Track {
    id: number;
    kosmosId: string;
    title: string;
    added: string;
    creatives: {
      composers: TrackCreative[];
      mainArtists: TrackCreative[];
      featuredArtists: TrackCreative[];
      producers: TrackCreative[];
    };
    length: number;
    durationMs: number;
    bpm: number;
    isSfx: boolean;
    hasVocals: boolean;
    hidden: boolean;
    publicSlug: string;
    genres: Genre[];
    moods: Mood[];
    energyLevel: string;
    stems: {
      full: Stem;
      bass: Stem;
      drums: Stem;
      instruments: Stem;
      melody: Stem;
    };
    oldTitle: string;
    seriesId: number;
    metadataTags: string[];
    isExplicit: boolean;
    isCommercialRelease: boolean;
    imageUrl: string;
    coverArt: CoverArt;
    releaseDate: string;
    segmentGroups: SegmentGroup[];
  }
  
  interface Entities {
    tracks: {
      [key: string]: Track;
    };
  }
  
  export interface DataStructure {
    entities: Entities;
    meta: Meta;
  }

  interface Hit {
    trackId: number;
    stemType: string;
    matchedQueries: string[];
}

interface AggregationItem {
    key: number | string;
    count: number;
    displayKey?: string;
}

interface MinMax {
    value: number;
}

interface Aggregations {
    vocals: AggregationItem[];
    genres: AggregationItem[];
    moods: any[];
    tags: any[];
    energy: AggregationItem[];
    bpm: {
        min: MinMax;
        max: MinMax;
    };
    length: {
        min: MinMax;
        max: MinMax;
    };
    hashtags: any[];
}

interface Meta {
    term: string;
    hits: Hit[];
    duration: number;
    totalHits: number;
    totalPages: number;
    aggregations: Aggregations;
}



  export const moods = [
    "angry", "busy & frantic", "changing tempo", "chasing", "dark", "dreamy", 
    "eccentric", "elegant", "epic", "euphoric", "fear", "floating", "funny", 
    "glamorous", "happy", "heavy & ponderous", "hopeful", "laid back", "marching", 
    "mysterious", "peaceful", "quirky", "relaxing", "restless", "romantic", 
    "running", "sad", "scary", "sentimental", "sexy", "smooth", "sneaking", 
    "suspense", "weird"
  ];
  
  export const genres = [
    "abstract hip hop", "acoustic", "solo guitar", "solo piano", "ambient", "asmr", 
    "binaural beats", "drone", "new age", "ambient americana", "ambient dub", 
    "ambient pop", "ballad", "batida", "beats", "bloopers", "blues", "acoustic blues", 
    "african blues", "blues rock", "classic blues", "country blues", "delta blues", 
    "modern blues", "brass & marching band", "bagpipes", "military & historical", 
    "oompah", "breakbeat", "2-step", "big beat", "drum and bass", "dubstep", 
    "future garage", "jungle", "liquid funk", "techstep", "uk garage", "cartoons", 
    "children's music", "lullabies", "cinematic", "action", "adventure", "beautiful", 
    "build", "chase", "crime scene", "drama", "horror", "main title", "mystery", 
    "nostalgia", "pulses", "strange & weird", "supernatural", "suspense", "tragedy", 
    "circus & funfair", "amusement park", "classical", "choral", "classical crossover", 
    "contemporary classical", "indian classical", "orchestral", "orchestral hybrid", 
    "small ensemble", "solo instrumental", "string ensemble", "waltz", "classical period", 
    "comedy", "comedy rock", "conscious hip hop", "corporate", "country", "americana", 
    "bluegrass", "contemporary country", "country pop", "country rock", "traditional country", 
    "western", "cumbia pop", "dance", "dark ambient", "decade", "1950s", "1960s", 
    "1970s", "1980s", "1990s", "2000s", "2010s", "2020s", "disco", "boogie", "nu disco", 
    "downtempo", "balearic beat", "chillout", "chillstep", "chillwave", "trip hop", 
    "easy listening", "lounge", "electro-funk", "electronic", "bit music", "dark wave", 
    "edm", "electro", "electro swing", "eurodance", "footwork", "future bass", "hardstyle", 
    "idm", "indietronica", "jersey club", "melodic techno", "midtempo bass", "minimal techno", 
    "psytrance", "synthwave", "techno", "trance", "trap edm", "vaporwave", "electronica", 
    "euro-trance", "experimental electronic", "experimental hip hop", "fanfares", 
    "ceremonial & olympic", "filmi", "folk", "alternative folk", "celtic", 
    "contemporary folk", "folk pop", "indie folk", "klezmer", "polka", "funk", 
    "afro-funk", "funk rock", "synth funk", "hard trap", "hip hop", "alternative hip hop", 
    "boom bap", "bounce", "detroit trap", "drift phonk", "drill", "east coast hip hop", 
    "grime", "lo-fi hip hop", "old school hip hop", "trap", "west coast hip hop", 
    "hip hop soul", "horror synth", "house", "afro house", "amapiano", "ambient house", 
    "bass house", "big room house", "deep house", "electro house", "future funk", 
    "future house", "lo-fi house", "microhouse", "organic house", "outsider house", 
    "progressive house", "slap house", "tech house", "tribal house", "tropical house", 
    "huapango", "indian pop", "indie surf", "industrial metal", "j-pop", "j-rock", 
    "jazz", "acid jazz", "bebop", "big band", "classic jazz", "contemporary jazz", 
    "cool jazz", "dark jazz", "jazz fusion", "jazz-funk", "latin jazz", "ragtime", 
    "smooth jazz", "swing", "korean classical", "latin", "bolero", "bossa nova", 
    "calypso", "chachachá", "corrido tumbado", "cumbia", "flamenco", "funk carioca", 
    "guaracha edm", "latin pop", "mambo", "mariachi", "reggaeton", "rumba", "salsa", 
    "samba", "tango", "marching band", "metal", "heavy metal", "thrash metal", 
    "metalcore", "neoclassical dark wave", "norteño", "nu metal", "phonk", "pop", 
    "afrobeats", "alternative pop", "bedroom pop", "contemporary christian", 
    "dance-pop", "dream pop", "electropop", "europop", "hyperpop", "indie pop", 
    "k-pop", "pop rock", "schlager", "synth-pop", "teen pop", "pop soul", 
    "post-classical", "praise & worship", "psychedelic soul", "punk", "pop punk", 
    "punk rock", "r&b", "contemporary r&b", "motown", "ranchera", "reggae", "dub", 
    "ska", "regional mexicano", "religious music", "sneaky", "rock", "alternative rock", 
    "arena rock", "electronic rock", "folk rock", "garage rock", "grunge", "hard rock", 
    "indie rock", "post-rock", "psychedelic rock", "rock and roll", "rockabilly", 
    "roots rock", "soft rock", "surf rock", "romantic classical", "sambass", "screamo", 
    "singer-songwriter", "smooth soul", "son jarocho", "soul", "gospel", "neo soul", 
    "soul blues", "southern hip hop", "special occasions", "birthdays", "christmas", 
    "drinking songs", "funerals", "weddings", "speed house", "symphonic poem", 
    "uk drill", "vaudeville", "world & countries", "african continent", "cuba", 
    "greece", "india", "ireland", "japan", "korea", "mexico", "middle east", 
    "scandinavian", "the balkans", "usa", "world fusion"
  ];