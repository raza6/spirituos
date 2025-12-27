import express from 'express';
import { engine } from 'express-handlebars';
import Handlebars from 'handlebars';
import path from 'path';
import { getRandomSentence } from './services/tatoebaConnector';
import { analyzeSentence } from './services/satzklarConnector';
import { AnalysisComponent } from './types/analyzis';
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

Handlebars.registerPartial('sentencePart', 
`
  {{#noPunkt part.component}}
    <div class="tree-branch">
      <strong>
        {{#soloWord part.word}}
          <a class="deflink" href="https://en.wiktionary.org/wiki/{{uncapitalize part}}#German">{{part.word}}</a>
        {{else}}
          {{part.word}}
        {{/soloWord}}
      </strong>-
      <em data-tooltip="{{part.description}}">{{part.component}}</em>
      {{#sameChild part}}
        <em data-tooltip="{{part.children.[0].description}}">{{part.children.[0].component}}</em>
      {{else}}
        {{#each part.children}}
          {{>sentencePart part=.}}
        {{/each}}
      {{/sameChild}}
    </div>
  {{/noPunkt}}
`);

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
  if (element.component !== 'Substantiv') {
    return element.word[0].toLowerCase() + element.word.slice(1);
  } else {
    return element.word;
  }
});

app.get('/', async (req, res) => {
  try {
    const sentence = await getRandomSentence();
  
    res.render('home', { 
      sentence: {
        german: sentence.text,
        english: sentence.translations.filter(t => t.lang === 'eng')[0].text,
        audio: sentence.audios[0].download_url,
        urlEncoded: encodeURI(sentence.text)
      }
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
  
    res.render('analyzis', {
      layout: false,
      analyzis: {
        structure: analyzisCore.structure,
        wordOrder: analyzisCore.wordOrder,
        caseUsage: analyzisCore.caseUsage,
        explanation: analyzisCore.pragmatics.explanation,
        tree: analyzisTree.children,
        references
      }
    });
  } catch {
    res.send("oops");
  }
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