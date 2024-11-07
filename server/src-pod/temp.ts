import { AudioFile, CharLine, Clip, MusicLine, MusicType } from "./util_pod";
import { TEMP_DATA_PATH } from "./init";

export let temp_result_file = "ea91931f-47f7-4785-8c89-9b5bfa19b5f0";

// this is a function because TEMP_DATA_PATH is not available at the time of import
export let getTempMusic = (): Clip[] => [
    {
        "audio": {
            "id": "e5f5f40e-4083-4628-89a3-de19f0444477",
            "url": "./temp-data/music/e5f5f40e-4083-4628-89a3-de19f0444477.mp3",
            "rawDuration": 17.55,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Background Music: An intense patriotic Russian song slowly fading out]",
            "order": 1,
            "id": "e5f5f40e-4083-4628-89a3-de19f0444477",
            "type": "Background Music",
            "music_description": "An intense patriotic Russian song slowly fading out"
        },
        "id": "e5f5f40e-4083-4628-89a3-de19f0444477"
    },
    {
        "audio": {
            "id": "fec3e643-8b12-4622-a99c-172080394284",
            "url": "./temp-data/music/fec3e643-8b12-4622-a99c-172080394284.mp3",
            "rawDuration": 60.02,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: A bustling Russian street]",
            "order": 3,
            "id": "fec3e643-8b12-4622-a99c-172080394284",
            "type": "Sound Effect",
            "music_description": "A bustling Russian street"
        },
        "id": "fec3e643-8b12-4622-a99c-172080394284"
    },
    {
        "audio": {
            "id": "d8e3bab6-5769-4e2e-99e5-5cd16228df24",
            "url": "./temp-data/music/d8e3bab6-5769-4e2e-99e5-5cd16228df24.mp3",
            "rawDuration": 60.02,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: Chanting crowds and sirens]",
            "order": 5,
            "id": "d8e3bab6-5769-4e2e-99e5-5cd16228df24",
            "type": "Sound Effect",
            "music_description": "Chanting crowds and sirens"
        },
        "id": "d8e3bab6-5769-4e2e-99e5-5cd16228df24"
    },
    {
        "audio": {
            "id": "8fedc09f-7dbf-4650-be6c-e483818b6040",
            "url": "./temp-data/music/8fedc09f-7dbf-4650-be6c-e483818b6040.mp3",
            "rawDuration": 60.02,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: Heavy rainfall, symbolizing repression]",
            "order": 8,
            "id": "8fedc09f-7dbf-4650-be6c-e483818b6040",
            "type": "Sound Effect",
            "music_description": "Heavy rainfall, symbolizing repression"
        },
        "id": "8fedc09f-7dbf-4650-be6c-e483818b6040"
    },
    {
        "audio": {
            "id": "e0f9b117-9a93-4188-a55a-4ef26e318790",
            "url": "./temp-data/music/e0f9b117-9a93-4188-a55a-4ef26e318790.mp3",
            "rawDuration": 38.27,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Background Music: A tense, suspenseful tune]",
            "order": 11,
            "id": "e0f9b117-9a93-4188-a55a-4ef26e318790",
            "type": "Background Music",
            "music_description": "A tense, suspenseful tune"
        },
        "id": "e0f9b117-9a93-4188-a55a-4ef26e318790"
    },
    {
        "audio": {
            "id": "f760691d-8dc2-4a7a-ab77-0696f948bb53",
            "url": "./temp-data/music/f760691d-8dc2-4a7a-ab77-0696f948bb53.mp3",
            "rawDuration": 6.5,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: Crickets chirping, symbolizing the silent resistance]",
            "order": 14,
            "id": "f760691d-8dc2-4a7a-ab77-0696f948bb53",
            "type": "Sound Effect",
            "music_description": "Crickets chirping, symbolizing the silent resistance"
        },
        "id": "f760691d-8dc2-4a7a-ab77-0696f948bb53"
    },
    {
        "audio": {
            "id": "4dcb891d-cf19-481f-a3d2-64b69a2d8578",
            "url": "./temp-data/music/4dcb891d-cf19-481f-a3d2-64b69a2d8578.mp3",
            "rawDuration": 26.98,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Background Music: Inspirational, hopeful music]",
            "order": 16,
            "id": "4dcb891d-cf19-481f-a3d2-64b69a2d8578",
            "type": "Background Music",
            "music_description": "Inspirational, hopeful music"
        },
        "id": "4dcb891d-cf19-481f-a3d2-64b69a2d8578"
    },
    {
        "audio": {
            "id": "13504c7e-371d-4c0d-bb0c-9ff47da90d28",
            "url": "./temp-data/music/13504c7e-371d-4c0d-bb0c-9ff47da90d28.mp3",
            "rawDuration": 1.25,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: Pen scribbling on paper]",
            "order": 19,
            "id": "13504c7e-371d-4c0d-bb0c-9ff47da90d28",
            "type": "Sound Effect",
            "music_description": "Pen scribbling on paper"
        },
        "id": "13504c7e-371d-4c0d-bb0c-9ff47da90d28"
    },
    {
        "audio": {
            "id": "d64d9c62-79ac-4b61-b567-a05cf8ca09f0",
            "url": "./temp-data/music/d64d9c62-79ac-4b61-b567-a05cf8ca09f0.mp3",
            "rawDuration": 13.28,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Background Music: Slow, contemplative piano music]",
            "order": 22,
            "id": "d64d9c62-79ac-4b61-b567-a05cf8ca09f0",
            "type": "Background Music",
            "music_description": "Slow, contemplative piano music"
        },
        "id": "d64d9c62-79ac-4b61-b567-a05cf8ca09f0"
    },
    {
        "audio": {
            "id": "0a41612a-c8e2-48ac-912f-161bb9b25557",
            "url": "./temp-data/music/0a41612a-c8e2-48ac-912f-161bb9b25557.mp3",
            "rawDuration": 38.95,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: Applause and cheers]",
            "order": 25,
            "id": "0a41612a-c8e2-48ac-912f-161bb9b25557",
            "type": "Sound Effect",
            "music_description": "Applause and cheers"
        },
        "id": "0a41612a-c8e2-48ac-912f-161bb9b25557"
    },
    {
        "audio": {
            "id": "dccc2def-e26c-4ed1-9fa2-0694ccfbe707",
            "url": "./temp-data/music/dccc2def-e26c-4ed1-9fa2-0694ccfbe707.mp3",
            "rawDuration": 21.41,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Background Music: Uplifting orchestral music]",
            "order": 27,
            "id": "dccc2def-e26c-4ed1-9fa2-0694ccfbe707",
            "type": "Background Music",
            "music_description": "Uplifting orchestral music"
        },
        "id": "dccc2def-e26c-4ed1-9fa2-0694ccfbe707"
    },
    {
        "audio": {
            "id": "df73b4dc-2eaf-4887-8cfa-28618f4e932d",
            "url": "./temp-data/music/df73b4dc-2eaf-4887-8cfa-28618f4e932d.mp3",
            "rawDuration": 17.59,
            "start": -1,
            "duration": -1
        },
        "line": {
            "raw_string": "[Sound Effect: Fading footsteps, symbolizing a journey continuing]",
            "order": 29,
            "id": "df73b4dc-2eaf-4887-8cfa-28618f4e932d",
            "type": "Sound Effect",
            "music_description": "Fading footsteps, symbolizing a journey continuing"
        },
        "id": "df73b4dc-2eaf-4887-8cfa-28618f4e932d"
    }
]


export let getTempChar = (): Clip[] => [
    {
        "audio": {
            "id": "15d10d53-da8f-4858-a509-0acafccb7cbc",
            "url": "./temp-data/dialogue/15d10d53-da8f-4858-a509-0acafccb7cbc.mp3",
            "duration": 31.66,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: [Serious] Welcome to Podcast Pro. I'm your host, Adam Page. Today, we're diving deep into a hidden world of strength, resilience, and protest. We're exploring the often misunderstood and overlooked anti-war movement in Russia. We'll uncover surprising stories of defiance, courage, and innovative resistance against an incredibly repressive regime. Joining me are correspondents Dan Storyev, Daria Korolenko, and Lauren McCarthy who have closely studied this movement from the ground up.",
            "order": 2,
            "id": "15d10d53-da8f-4858-a509-0acafccb7cbc",
            "character": "Adam Page",
            "raw_dialogue": "[Serious] Welcome to Podcast Pro. I'm your host, Adam Page. Today, we're diving deep into a hidden world of strength, resilience, and protest. We're exploring the often misunderstood and overlooked anti-war movement in Russia. We'll uncover surprising stories of defiance, courage, and innovative resistance against an incredibly repressive regime. Joining me are correspondents Dan Storyev, Daria Korolenko, and Lauren McCarthy who have closely studied this movement from the ground up.",
            "dialogue": "Welcome to Podcast Pro. I'm your host, Adam Page. Today, we're diving deep into a hidden world of strength, resilience, and protest. We're exploring the often misunderstood and overlooked anti-war movement in Russia. We'll uncover surprising stories of defiance, courage, and innovative resistance against an incredibly repressive regime. Joining me are correspondents Dan Storyev, Daria Korolenko, and Lauren McCarthy who have closely studied this movement from the ground up.",
            "adjective": "Serious"
        },
        "id": "15d10d53-da8f-4858-a509-0acafccb7cbc"
    },
    {
        "audio": {
            "id": "58eb76e5-9478-4fcc-87db-c018be619e2d",
            "url": "./temp-data/dialogue/58eb76e5-9478-4fcc-87db-c018be619e2d.mp3",
            "duration": 20.663,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: To understand the Russian anti-war movement, we first need to shed our Western expectations of what protests should look like. Western public opinion often visualizes a protester as youthful, articulate, and holding a placard with a clear message. But in Russia, the picture is starkly different.",
            "order": 4,
            "id": "58eb76e5-9478-4fcc-87db-c018be619e2d",
            "character": "Adam Page",
            "raw_dialogue": "To understand the Russian anti-war movement, we first need to shed our Western expectations of what protests should look like. Western public opinion often visualizes a protester as youthful, articulate, and holding a placard with a clear message. But in Russia, the picture is starkly different.",
            "dialogue": "To understand the Russian anti-war movement, we first need to shed our Western expectations of what protests should look like. Western public opinion often visualizes a protester as youthful, articulate, and holding a placard with a clear message. But in Russia, the picture is starkly different.",
            "adjective": ""
        },
        "id": "58eb76e5-9478-4fcc-87db-c018be619e2d"
    },
    {
        "audio": {
            "id": "f99706b6-f7c5-4dee-9cd6-872e873c4295",
            "url": "./temp-data/dialogue/f99706b6-f7c5-4dee-9cd6-872e873c4295.mp3",
            "duration": 24.895,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: On the morning of February 24th, 2022, people took to the streets in over 50 cities throughout Russia to protest the war in Ukraine. The demonstrations were fierce, but the state’s response was even fiercer. Police brutality was immense, with 1,974 people detained that very day. Yet, resilient Russians kept protesting, enduring detentions, beatings, and worse.",
            "order": 6,
            "id": "f99706b6-f7c5-4dee-9cd6-872e873c4295",
            "character": "Adam Page",
            "raw_dialogue": "On the morning of February 24th, 2022, people took to the streets in over 50 cities throughout Russia to protest the war in Ukraine. The demonstrations were fierce, but the state’s response was even fiercer. Police brutality was immense, with 1,974 people detained that very day. Yet, resilient Russians kept protesting, enduring detentions, beatings, and worse.",
            "dialogue": "On the morning of February 24th, 2022, people took to the streets in over 50 cities throughout Russia to protest the war in Ukraine. The demonstrations were fierce, but the state’s response was even fiercer. Police brutality was immense, with 1,974 people detained that very day. Yet, resilient Russians kept protesting, enduring detentions, beatings, and worse.",
            "adjective": ""
        },
        "id": "f99706b6-f7c5-4dee-9cd6-872e873c4295"
    },
    {
        "audio": {
            "id": "740393b2-6ea1-4baa-ab0f-aafb15641b3f",
            "url": "./temp-data/dialogue/740393b2-6ea1-4baa-ab0f-aafb15641b3f.mp3",
            "duration": 22.831,
            "start": -1
        },
        "line": {
            "raw_string": "Dan Storyev: [Earnest] By March 2022, it became clear that traditional Western-style protests wouldn't work against a regime so adept at suppression. The Russian state has about 630 officers per 100,000 people, more than double that in America or Britain. With police brutality rampant, public fear of protests grew significantly.",
            "order": 7,
            "id": "740393b2-6ea1-4baa-ab0f-aafb15641b3f",
            "character": "Dan Storyev",
            "raw_dialogue": "[Earnest] By March 2022, it became clear that traditional Western-style protests wouldn't work against a regime so adept at suppression. The Russian state has about 630 officers per 100,000 people, more than double that in America or Britain. With police brutality rampant, public fear of protests grew significantly.",
            "dialogue": "By March 2022, it became clear that traditional Western-style protests wouldn't work against a regime so adept at suppression. The Russian state has about 630 officers per 100,000 people, more than double that in America or Britain. With police brutality rampant, public fear of protests grew significantly.",
            "adjective": "Earnest"
        },
        "id": "740393b2-6ea1-4baa-ab0f-aafb15641b3f"
    },
    {
        "audio": {
            "id": "0caa019f-4d0a-44d4-9e36-4c399b895635",
            "url": "./temp-data/dialogue/0caa019f-4d0a-44d4-9e36-4c399b895635.mp3",
            "duration": 21.211,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: Attempts at violent resistance were swiftly crushed. Instead, activists began creatively adapting to their repressive environment. We spoke with several activists who have risked everything for their beliefs. One such activist is Kirill Butylin, who covertly set a military recruitment center on fire to destroy draft records.",
            "order": 9,
            "id": "0caa019f-4d0a-44d4-9e36-4c399b895635",
            "character": "Adam Page",
            "raw_dialogue": "Attempts at violent resistance were swiftly crushed. Instead, activists began creatively adapting to their repressive environment. We spoke with several activists who have risked everything for their beliefs. One such activist is Kirill Butylin, who covertly set a military recruitment center on fire to destroy draft records.",
            "dialogue": "Attempts at violent resistance were swiftly crushed. Instead, activists began creatively adapting to their repressive environment. We spoke with several activists who have risked everything for their beliefs. One such activist is Kirill Butylin, who covertly set a military recruitment center on fire to destroy draft records.",
            "adjective": ""
        },
        "id": "0caa019f-4d0a-44d4-9e36-4c399b895635"
    },
    {
        "audio": {
            "id": "82af3a7b-d6ab-4267-8645-ae7869f73094",
            "url": "./temp-data/dialogue/82af3a7b-d6ab-4267-8645-ae7869f73094.mp3",
            "duration": 11.781,
            "start": -1
        },
        "line": {
            "raw_string": "Daria Korolenko: [Somber] Kirill’s act of defiance led to a 13-year prison sentence. Yet, even as mass street protests dwindled, protests did not vanish. They evolved into more subtle forms, showing us that Russians have found innovative ways to resist.",
            "order": 10,
            "id": "82af3a7b-d6ab-4267-8645-ae7869f73094",
            "character": "Daria Korolenko",
            "raw_dialogue": "[Somber] Kirill’s act of defiance led to a 13-year prison sentence. Yet, even as mass street protests dwindled, protests did not vanish. They evolved into more subtle forms, showing us that Russians have found innovative ways to resist.",
            "dialogue": "Kirill’s act of defiance led to a 13-year prison sentence. Yet, even as mass street protests dwindled, protests did not vanish. They evolved into more subtle forms, showing us that Russians have found innovative ways to resist.",
            "adjective": "Somber"
        },
        "id": "82af3a7b-d6ab-4267-8645-ae7869f73094"
    },
    {
        "audio": {
            "id": "991aa3db-513a-4418-9ca5-212feff405c2",
            "url": "./temp-data/dialogue/991aa3db-513a-4418-9ca5-212feff405c2.mp3",
            "duration": 15.412,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: Today, we see solitary pickets, graffiti, and social media protests. Despite the high risk, many Russians still choose to hold signs in public, post dissent on social media, or even swap price tags in supermarkets with anti-war messages.",
            "order": 12,
            "id": "991aa3db-513a-4418-9ca5-212feff405c2",
            "character": "Adam Page",
            "raw_dialogue": "Today, we see solitary pickets, graffiti, and social media protests. Despite the high risk, many Russians still choose to hold signs in public, post dissent on social media, or even swap price tags in supermarkets with anti-war messages.",
            "dialogue": "Today, we see solitary pickets, graffiti, and social media protests. Despite the high risk, many Russians still choose to hold signs in public, post dissent on social media, or even swap price tags in supermarkets with anti-war messages.",
            "adjective": ""
        },
        "id": "991aa3db-513a-4418-9ca5-212feff405c2"
    },
    {
        "audio": {
            "id": "1eb1372c-d009-4e3e-9eea-9f509fa1cb44",
            "url": "./temp-data/dialogue/1eb1372c-d009-4e3e-9eea-9f509fa1cb44.mp3",
            "duration": 22.57,
            "start": -1
        },
        "line": {
            "raw_string": "Lauren McCarthy: [Reflective] This subtle resistance comes with grave consequences. Igor Baryshnikov, an elderly activist, was jailed for 7.5 years simply for his anti-war posts. His story is particularly heart-wrenching; he was unable to care for his mother, a WWII survivor, who lost her mental function and died while he was in custody.",
            "order": 13,
            "id": "1eb1372c-d009-4e3e-9eea-9f509fa1cb44",
            "character": "Lauren McCarthy",
            "raw_dialogue": "[Reflective] This subtle resistance comes with grave consequences. Igor Baryshnikov, an elderly activist, was jailed for 7.5 years simply for his anti-war posts. His story is particularly heart-wrenching; he was unable to care for his mother, a WWII survivor, who lost her mental function and died while he was in custody.",
            "dialogue": "This subtle resistance comes with grave consequences. Igor Baryshnikov, an elderly activist, was jailed for 7.5 years simply for his anti-war posts. His story is particularly heart-wrenching; he was unable to care for his mother, a WWII survivor, who lost her mental function and died while he was in custody.",
            "adjective": "Reflective"
        },
        "id": "1eb1372c-d009-4e3e-9eea-9f509fa1cb44"
    },
    {
        "audio": {
            "id": "4ce65376-3ccd-4ec2-9447-9cb8960d6492",
            "url": "./temp-data/dialogue/4ce65376-3ccd-4ec2-9447-9cb8960d6492.mp3",
            "duration": 12.722,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: Even amidst this brutal crackdown, new initiatives have sprung up. Russians continue to donate to the Ukrainian military and aid programs, help Ukrainian refugees, and work tirelessly from abroad.",
            "order": 15,
            "id": "4ce65376-3ccd-4ec2-9447-9cb8960d6492",
            "character": "Adam Page",
            "raw_dialogue": "Even amidst this brutal crackdown, new initiatives have sprung up. Russians continue to donate to the Ukrainian military and aid programs, help Ukrainian refugees, and work tirelessly from abroad.",
            "dialogue": "Even amidst this brutal crackdown, new initiatives have sprung up. Russians continue to donate to the Ukrainian military and aid programs, help Ukrainian refugees, and work tirelessly from abroad.",
            "adjective": ""
        },
        "id": "4ce65376-3ccd-4ec2-9447-9cb8960d6492"
    },
    {
        "audio": {
            "id": "b5ec1658-7372-4ec5-b6e7-958d1cc4598f",
            "url": "./temp-data/dialogue/b5ec1658-7372-4ec5-b6e7-958d1cc4598f.mp3",
            "duration": 18.469,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: Groups like Get Lost, which helps Russians flee abroad, and Feminist Anti-War Resistance, unite to bolster the anti-war efforts. Sasha Skochilenko, an artist, embodies this quiet rebellion. She's serving seven years in prison for putting anti-war stickers in a supermarket.",
            "order": 17,
            "id": "b5ec1658-7372-4ec5-b6e7-958d1cc4598f",
            "character": "Adam Page",
            "raw_dialogue": "Groups like Get Lost, which helps Russians flee abroad, and Feminist Anti-War Resistance, unite to bolster the anti-war efforts. Sasha Skochilenko, an artist, embodies this quiet rebellion. She's serving seven years in prison for putting anti-war stickers in a supermarket.",
            "dialogue": "Groups like Get Lost, which helps Russians flee abroad, and Feminist Anti-War Resistance, unite to bolster the anti-war efforts. Sasha Skochilenko, an artist, embodies this quiet rebellion. She's serving seven years in prison for putting anti-war stickers in a supermarket.",
            "adjective": ""
        },
        "id": "b5ec1658-7372-4ec5-b6e7-958d1cc4598f"
    },
    {
        "audio": {
            "id": "7d51fbd4-ea4d-4d0d-acbf-1bcb6793e360",
            "url": "./temp-data/dialogue/7d51fbd4-ea4d-4d0d-acbf-1bcb6793e360.mp3",
            "duration": 19.357,
            "start": -1
        },
        "line": {
            "raw_string": "Dan Storyev: [Encouraging] Their bravery shows us the tremendous power and diversity within Russia’s anti-war movement. The Kremlin's crackdown has, paradoxically, energized civil society. From organized letter-writing campaigns to radical activism and journalism, defiance lives on.",
            "order": 18,
            "id": "7d51fbd4-ea4d-4d0d-acbf-1bcb6793e360",
            "character": "Dan Storyev",
            "raw_dialogue": "[Encouraging] Their bravery shows us the tremendous power and diversity within Russia’s anti-war movement. The Kremlin's crackdown has, paradoxically, energized civil society. From organized letter-writing campaigns to radical activism and journalism, defiance lives on.",
            "dialogue": "Their bravery shows us the tremendous power and diversity within Russia’s anti-war movement. The Kremlin's crackdown has, paradoxically, energized civil society. From organized letter-writing campaigns to radical activism and journalism, defiance lives on.",
            "adjective": "Encouraging"
        },
        "id": "7d51fbd4-ea4d-4d0d-acbf-1bcb6793e360"
    },
    {
        "audio": {
            "id": "c52f4588-549f-4b88-bde4-e8a0c60a02a3",
            "url": "./temp-data/dialogue/c52f4588-549f-4b88-bde4-e8a0c60a02a3.mp3",
            "duration": 11.128,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: And let's not forget those who risk their lives to spread information. Evan Gershkovich and Maria Ponomarenko are just a couple of the many journalists facing serious repercussions for their work.",
            "order": 20,
            "id": "c52f4588-549f-4b88-bde4-e8a0c60a02a3",
            "character": "Adam Page",
            "raw_dialogue": "And let's not forget those who risk their lives to spread information. Evan Gershkovich and Maria Ponomarenko are just a couple of the many journalists facing serious repercussions for their work.",
            "dialogue": "And let's not forget those who risk their lives to spread information. Evan Gershkovich and Maria Ponomarenko are just a couple of the many journalists facing serious repercussions for their work.",
            "adjective": ""
        },
        "id": "c52f4588-549f-4b88-bde4-e8a0c60a02a3"
    },
    {
        "audio": {
            "id": "b32edf69-6f9c-497f-b4f3-0ae6803b526a",
            "url": "./temp-data/dialogue/b32edf69-6f9c-497f-b4f3-0ae6803b526a.mp3",
            "duration": 11.128,
            "start": -1
        },
        "line": {
            "raw_string": "Daria Korolenko: [Solemn] Tragically, spreading information can be deadly. Anatoly Berezikov was tortured to death for distributing pro-Ukraine leaflets. His story is a somber reminder of the risks activists face daily.",
            "order": 21,
            "id": "b32edf69-6f9c-497f-b4f3-0ae6803b526a",
            "character": "Daria Korolenko",
            "raw_dialogue": "[Solemn] Tragically, spreading information can be deadly. Anatoly Berezikov was tortured to death for distributing pro-Ukraine leaflets. His story is a somber reminder of the risks activists face daily.",
            "dialogue": "Tragically, spreading information can be deadly. Anatoly Berezikov was tortured to death for distributing pro-Ukraine leaflets. His story is a somber reminder of the risks activists face daily.",
            "adjective": "Solemn"
        },
        "id": "b32edf69-6f9c-497f-b4f3-0ae6803b526a"
    },
    {
        "audio": {
            "id": "92c192b1-7867-4e13-961b-4dce6175fd2f",
            "url": "./temp-data/dialogue/92c192b1-7867-4e13-961b-4dce6175fd2f.mp3",
            "duration": 16.562,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: Despite this repression, the anti-war movement continues to thrive. New initiatives, community aid projects, and diaspora organizations keep the flame of resistance alive. It is a diffuse, mass protest, representing a wide array of people from across the country.",
            "order": 23,
            "id": "92c192b1-7867-4e13-961b-4dce6175fd2f",
            "character": "Adam Page",
            "raw_dialogue": "Despite this repression, the anti-war movement continues to thrive. New initiatives, community aid projects, and diaspora organizations keep the flame of resistance alive. It is a diffuse, mass protest, representing a wide array of people from across the country.",
            "dialogue": "Despite this repression, the anti-war movement continues to thrive. New initiatives, community aid projects, and diaspora organizations keep the flame of resistance alive. It is a diffuse, mass protest, representing a wide array of people from across the country.",
            "adjective": ""
        },
        "id": "92c192b1-7867-4e13-961b-4dce6175fd2f"
    },
    {
        "audio": {
            "id": "db19cb09-e9e8-4022-84c8-dae8135368bc",
            "url": "./temp-data/dialogue/db19cb09-e9e8-4022-84c8-dae8135368bc.mp3",
            "duration": 16.797,
            "start": -1
        },
        "line": {
            "raw_string": "Lauren McCarthy: [Hopeful] The anti-war movement is more than just a protest; it is a testament to human resilience, determination, and solidarity. We must ask not why Russians aren’t protesting, but why they continue to protest despite the overwhelming threats they face.",
            "order": 24,
            "id": "db19cb09-e9e8-4022-84c8-dae8135368bc",
            "character": "Lauren McCarthy",
            "raw_dialogue": "[Hopeful] The anti-war movement is more than just a protest; it is a testament to human resilience, determination, and solidarity. We must ask not why Russians aren’t protesting, but why they continue to protest despite the overwhelming threats they face.",
            "dialogue": "The anti-war movement is more than just a protest; it is a testament to human resilience, determination, and solidarity. We must ask not why Russians aren’t protesting, but why they continue to protest despite the overwhelming threats they face.",
            "adjective": "Hopeful"
        },
        "id": "db19cb09-e9e8-4022-84c8-dae8135368bc"
    },
    {
        "audio": {
            "id": "bde5f6a1-125b-4f0f-9e56-6573c43645bf",
            "url": "./temp-data/dialogue/bde5f6a1-125b-4f0f-9e56-6573c43645bf.mp3",
            "duration": 15.047,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: For more on this resilient and innovative movement, stay tuned to Podcast Pro. I'm Adam Page. Thank you for joining us, and remember, the fight for freedom and peace is a universal one. Wherever you are, whatever you believe, your voice matters.",
            "order": 26,
            "id": "bde5f6a1-125b-4f0f-9e56-6573c43645bf",
            "character": "Adam Page",
            "raw_dialogue": "For more on this resilient and innovative movement, stay tuned to Podcast Pro. I'm Adam Page. Thank you for joining us, and remember, the fight for freedom and peace is a universal one. Wherever you are, whatever you believe, your voice matters.",
            "dialogue": "For more on this resilient and innovative movement, stay tuned to Podcast Pro. I'm Adam Page. Thank you for joining us, and remember, the fight for freedom and peace is a universal one. Wherever you are, whatever you believe, your voice matters.",
            "adjective": ""
        },
        "id": "bde5f6a1-125b-4f0f-9e56-6573c43645bf"
    },
    {
        "audio": {
            "id": "898b5ea1-c3e8-4946-ba44-841bb15433fa",
            "url": "./temp-data/dialogue/898b5ea1-c3e8-4946-ba44-841bb15433fa.mp3",
            "duration": 1.332,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: Until next time.",
            "order": 28,
            "id": "898b5ea1-c3e8-4946-ba44-841bb15433fa",
            "character": "Adam Page",
            "raw_dialogue": "Until next time.",
            "dialogue": "Until next time.",
            "adjective": ""
        },
        "id": "898b5ea1-c3e8-4946-ba44-841bb15433fa"
    },
    {
        "audio": {
            "id": "3a8dcefa-5dd3-4cb0-9c1c-43431a16668a",
            "url": "./temp-data/dialogue/3a8dcefa-5dd3-4cb0-9c1c-43431a16668a.mp3",
            "duration": 1.907,
            "start": -1
        },
        "line": {
            "raw_string": "Adam Page: [Fading Out] Thank you for listening to Podcast Pro...",
            "order": 30,
            "id": "3a8dcefa-5dd3-4cb0-9c1c-43431a16668a",
            "character": "Adam Page",
            "raw_dialogue": "[Fading Out] Thank you for listening to Podcast Pro...",
            "dialogue": "Thank you for listening to Podcast Pro...",
            "adjective": "Fading Out"
        },
        "id": "3a8dcefa-5dd3-4cb0-9c1c-43431a16668a"
    }
]