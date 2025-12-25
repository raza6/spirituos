import ky from "ky";
import { Sentence, SentenceSearchResult } from "../types/sentence";
 
const getRandomSentence = async (): Promise<Sentence> => {
  const sentences = await ky(
    "https://api.tatoeba.org/unstable/sentences?lang=deu&word_count=4-20&has_audio=yes&trans%3Alang=eng&trans%3Acount=%210&sort=random&showtrans%3Alang=eng",
    {
      method: "GET"
    }
  ).json() as SentenceSearchResult;

  return sentences.data.filter(t => t.audios.length > 0)[0];
}

export { getRandomSentence };