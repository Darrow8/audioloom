
export let masculine_voices = [
    "pqHfZKP75CvOlQylNhV4",
    "nPczCjzI2devNBz1zQrb",
    "IKne3meq5aSn9XLyUdCD",
    "cjVigY5qzO86Huf0OWal",
    "TX3LPaxmHKxFdv7VOQHJ",
    "876MHA6EtWKaHTEGzjy5",
    "C8ZGTRs8koIlo6hG4dtq",
    "TWUKKXAylkYxxlPe4gx0",
    "876MHA6EtWKaHTEGzjy5",
    "4TqSkQOuasn8QDvHi3jF",
    "LlZr3QuzbW4WrPjgATHG",
    "uju3wxzG5OhpWcoi3SMy",
    "pVnrL6sighQX7hVz89cp"
]

export let feminine_voices = [
    "wVZ5qbJFYF3snuC65nb4",
    "6vTyAgAT8PncODBcLjRf",
    "P7x743VjyZEOihNNygQ9",
    "MnUw1cSnpiLoLhpd3Hqp",
    "OYTbf65OHHFELVut7v2H",
    "0lyV68Aacjmcsjj9LO1q",
    "prXE2qOa3nbiL3y1Qhu3",
    "pBZVCk298iJlHAcHQwLr",
    "0F2wDqEyuZzoQIxmFSNU",
    "21m00Tcm4TlvDq8ikWAM",
    "oWAxZDx7w5VEj9dCyTzz"
]

export class Character {
    name: string;
    bio: string;
    voice_model: string;
    constructor(name: string, bio: string, voice_model: string) {
        this.name = name;
        this.bio = bio;
        this.voice_model = voice_model;
    }
}