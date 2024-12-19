# Pod Server

## General Structure of pod functions

`src-db` handles all database interactions, `src-pod` handles all podcast generation

- `main.ts` handles all endpoints to be called
- `temp_data.ts` stores temp data that is used for testing
- `init.ts` holds startup functions that must be run
- `local.ts` handles local creation, reading, and deletion of files

- process_ files manipulate data based on name groupings 
- util_ files hold classes and interfaces to be used by other files
- pass_ files primarily retrieve or send data from APIs to be used by process_ files

## Terminology

- Reading: raw pdf/txt file that is passed to us 
- Article: cleaned reading as txt file
- Script: podcast script as txt file generated from article in special format
- Podcast: audio file generated from script

## Flow of Usage for Pod generation

The main thing we will be doing with pod functions is creating a podcast from a single pdf/document. Here is the general flow

1. Upload Reading to S3

2. Create Script from Reading 
  - Clean, Trim, and Format Reading (Ideally PDF or TXT) for Usage into an Article (TXT format)
  - Convert Article to Script with LLM
  - Save to AWS S3 Bucket

3. Create Podcast from Script
 - Generate Audio Clips — Dialogue, Background Music, and SFX — from Script
 - Concatenate Dialogue Audio Clips into a file
 - Overlay Background Music and SFX Clips 
 - Save to AWS S3 Bucket


## Dialogue and Music Overlay Design Choice

The dialogue and background music/sound effect files and start and end at various times. 

For now, all sound effects and background music files will start at the exact time that the preceeding dialogue ends. 

If there is no proceeding dialogue, then the music will start at t=0

If the music file is still running when another one is scheduled to start, then it will be cut short. 

# VPC Commands

SSH into the VPC:
`ssh root@164.90.153.167`
`ssh manager@164.90.153.167`

To run commands in docker container:
`docker exec -it manager-server-1 /bin/sh`

To get logs from docker container:
`docker logs manager-server-1 -f`



