import ky from "ky";
import { AnalyzisResult } from "../types/analyzis";
 
const analyzeSentence = async (sentence: string): Promise<AnalyzisResult> => {
  console.log('start analyze');
  const analyzeResult = await ky(
    "https://satzklar.net/api/v1/parse",
    {
      method: "POST",
      json: {
        text: sentence,
        format: "component",
        language: "en"
      },
      timeout: 60000
    }
  ).json() as AnalyzisResult;

  return analyzeResult;
}

export { analyzeSentence };