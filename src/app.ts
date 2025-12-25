import express from 'express';
import { getRandomSentence } from './services/tatoebaConnector';
import { analyzeSentence } from './services/satzklarConnector';
const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  const sentence = await getRandomSentence();
  const analyzis = await analyzeSentence(sentence.text);

  const analyzisCore = analyzis.data.output.component.analysis;
  const analyzisTree = analyzis.data.output.component.tree;

  const html = `
    <p>${sentence.text}</p>
    <p>${sentence.translations.filter(t => t.lang === 'eng')[0].text}</p>
    <audio controls src="${sentence.audios[0].download_url}"></audio>
    <p>${analyzisCore.structure}</p>
    <p>${analyzisCore.wordOrder}</p>
    <p>${analyzisCore.caseUsage}</p>
    <p>${analyzisCore.pragmatics.explanation}</p>
    ${
      analyzisTree.children.map(c => c.word + ' ' + c.description)
    }
  `
  res.send(html);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});