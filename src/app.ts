import express from 'express';
import { engine } from 'express-handlebars';
import Handlebars from 'handlebars';
import { JSONFilePreset } from 'lowdb/node';
import { Low } from 'lowdb';
import path from 'path';
import { getRandomSentence } from './services/tatoebaConnector';
import { analyzeSentence } from './services/satzklarConnector';
import { AnalysisComponent } from './types/analyzis';
import { FullVM } from './types/display';
const app = express();
const port = 3012;

let db: Low<{ sentences: FullVM[]}>;
initDb();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

Handlebars.registerHelper('noPunkt', function (component: string, options) {
  if (component !== 'Interpunktion') {
    return options.fn(this);
  }
});

Handlebars.registerHelper('sameChild', function(parent: AnalysisComponent, options) {
  if (parent.children?.length === 1 && parent.word === parent.children?.[0]?.word) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('soloWord', function(word: string, options) {
  if (!word.includes(' ')) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('uncapitalize', function(element: AnalysisComponent): string {
  if (
    element.component === 'Substantiv' || 
    (element.children?.length === 1 && element.word === element.children?.[0]?.word && element.children?.[0]?.component === 'Substantiv')
  ) {
    return element.word;
  } else {
    return element.word[0].toLowerCase() + element.word.slice(1);
  }
});

Handlebars.registerHelper('urlEncoded', function(str: string): string {
  return encodeURI(str);
});

Handlebars.registerHelper('stringify', function(data: any): string {  
  return JSON.stringify(data);
});

async function initDb() {
  const defaultData = { sentences: [] };
  db = await JSONFilePreset(path.join(__dirname, 'db.json'), defaultData);
}

app.get('/', async (req, res) => {
  try {
    const sentence = await getRandomSentence();

    const currentFull = {
      sentence: {
        german: sentence.text,
        english: sentence.translations.filter(t => t.lang === 'eng')[0].text,
        audio: sentence.audios[0].download_url
      },
      analyzis: undefined
    }
  
    res.render('home', { 
      sentence: currentFull.sentence,
      saveable: true,
      hasPrevious: false,
      hasNext: true,
      next: 0
    });
  } catch {
    res.send("oops");
  }
});

app.get('/saved/:id', async (req, res) => {
  try {
    const currentId = parseInt(req.params.id, 10);
    const full = db.data.sentences[currentId];
    if (full === undefined) {
      res.send('oops');
    }

    const hasPrevious = currentId > 0;
    const previous = hasPrevious ? currentId-1 : undefined;
    const hasNext = currentId < db.data.sentences.length-1;
    const next = hasNext ? currentId+1 : undefined;
  
    res.render('home', { 
      sentence: full.sentence,
      analyzis: full.analyzis,
      saveable: false,
      hasPrevious,
      previous,
      hasNext,
      next
    });
  } catch {
    res.send("oops");
  }
});

app.get('/analyzis/:sentence', async (req, res) => {
  try {
    const analyzis = await analyzeSentence(req.params.sentence);
  
    const analyzisCore = analyzis.data.output.component.analysis;
    const analyzisTree = analyzis.data.output.component.tree;

    const references = flattenToReferences(analyzisTree.children)
    .filter((v, i, self) => {
      return self.findIndex(vv => vv.type === v.type) === i;
    });

    const currentFull = {
      analyzis: {
        structure: analyzisCore.structure,
        wordOrder: analyzisCore.wordOrder,
        caseUsage: analyzisCore.caseUsage,
        explanation: analyzisCore.pragmatics.explanation,
        tree: analyzisTree.children,
        references
      }
    };
  
    res.render('analyzis', {
      layout: false,
      analyzis: currentFull.analyzis
    });
  } catch {
    res.send("oops");
  }
});

app.post('/save', async (req, res) => {
  const full = {
    sentence: JSON.parse(req.body.sentence),
    analyzis: JSON.parse(req.body.analyzis)
  };
  if (full !== undefined && !db.data.sentences.some(s => s.sentence.german === full.sentence.german)) {
    await db.update(({ sentences }) => sentences.push(full));
  }
  return res.sendStatus(200);
});

function flattenToReferences(tree: AnalysisComponent[], ref = []): {type: string, ref: string}[] {
  for (const element of tree) {
    const currentRef = matchWithReference(element.component);
    if (currentRef) {
      ref = [...ref, { type: element.component, ref: currentRef }]  
    }
    if (element.children) {
      const childRef = flattenToReferences(element.children);
      if (childRef) {
        ref = [...ref, ...childRef];
      }
    }
  }

  return ref;
}

function matchWithReference(component: string): string {
  switch (component) {
    case 'Verb':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Verbs';
    case 'Koordination':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Coordinating_conjunctions';
    case 'Konjunktion':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Subordinating_conjunctions';
    case 'Infinitiv':
    case 'Infinitivphrase':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Sentences#Infinitive_Clauses';
    case 'Modalverb':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Modal_auxiliary_verbs';
    case 'Pronomen':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Personal_pronouns';
    case 'Artikel':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Noun_phrases#Articles_in_German';
    case 'Adverbiale':
    case 'Adverb':
    case 'Adjektiv':
      return 'https://en.wikibooks.org/wiki/German/Grammar/Adjectives_and_Adverbs';
    default:
      return;
  }
}

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});