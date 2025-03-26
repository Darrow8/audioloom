import os
import googleapiclient.discovery
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import json
import re

# If modifying these SCOPES, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']

def get_authenticated_service():
    """Get and return the authenticated YouTube API service."""
    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_info(json.load(open('token.json')))
    
    # If there are no valid credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return googleapiclient.discovery.build('youtube', 'v3', credentials=creds)

def get_video_id(url):
    """Extract the video ID from a YouTube URL."""
    # Regular expression patterns for YouTube URLs
    patterns = [
        r'^https?://(?:www\.)?youtube\.com/watch\?(?=.*v=([a-zA-Z0-9_-]+))(?:\S+)?$',
        r'^https?://(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]+)(?:\?.+)?$',
        r'^https?://(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]+)(?:\?.+)?$',
        r'^https?://(?:www\.)?youtube\.com/user/[a-zA-Z0-9_-]+/\S+v=([a-zA-Z0-9_-]+)(?:\S+)?$',
        r'^https?://(?:www\.)?youtu\.be/([a-zA-Z0-9_-]+)(?:\?.+)?$',
    ]
    
    for pattern in patterns:
        match = re.match(pattern, url)
        if match:
            return match.group(1)
    
    # If the input is already just a video ID
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    
    raise ValueError("Could not extract video ID from URL. Please check the format.")

def get_transcript(youtube, video_id):
    """Get the transcript for a YouTube video."""
    try:
        # First, check if captions are available for this video
        captions_response = youtube.captions().list(
            part="snippet",
            videoId=video_id
        ).execute()
        
        if not captions_response.get('items'):
            print(f"No captions found for video ID: {video_id}")
            return None
        
        # Get the first available caption track (usually the auto-generated one)
        caption_id = captions_response['items'][0]['id']
        
        # Download the caption track
        caption = youtube.captions().download(
            id=caption_id,
            tfmt='srt'  # SubRip format
        ).execute()
        
        # Process the SRT format to extract just the text
        transcript_text = process_srt(caption.decode('utf-8'))
        
        return transcript_text
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def process_srt(srt_content):
    """Process SubRip (SRT) format to extract just the transcript text."""
    # Regular expression to match SRT entries
    pattern = r'\d+\s+(\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3})\s+(.*?)(?=\n\d+\s+\d{2}:\d{2}:\d{2},\d{3}|$)'
    
    # Find all matches
    matches = re.findall(pattern, srt_content, re.DOTALL)
    
    # Extract and join the text parts
    transcript = []
    for timing, text in matches:
        # Clean up the text (remove HTML tags, extra whitespace, etc.)
        clean_text = re.sub(r'<[^>]+>', '', text)
        clean_text = re.sub(r'\n', ' ', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        transcript.append(f"[{timing}] {clean_text}")
    
    return '\n'.join(transcript)

def main():
    # Get authenticated YouTube API service
    youtube = get_authenticated_service()
    
    # Get video URL or ID from user
    video_url = input("Enter the YouTube video URL or ID: ")
    
    try:
        # Extract video ID
        video_id = get_video_id(video_url)
        print(f"Fetching transcript for video ID: {video_id}")
        
        # Get transcript
        transcript = get_transcript(youtube, video_id)
        
        if transcript:
            print("\nTranscript:")
            print(transcript)
            
            # Save to file
            with open(f"{video_id}_transcript.txt", "w", encoding="utf-8") as f:
                f.write(transcript)
            print(f"\nTranscript saved to {video_id}_transcript.txt")
        else:
            print("Failed to retrieve transcript. The video might not have captions available.")
            
    except ValueError as e:
        print(e)

if __name__ == "__main__":
    main()