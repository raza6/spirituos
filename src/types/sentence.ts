export type SentenceSearchResult = {
  data: Sentence[];
  paging: SentencePaging;
}

export type Sentence = {
  id: number;
  text: string;
  lang: string|null;
  script: string|null;
  license: string;
  owner: string|null;
  transcriptions: SentenceTranscription[];
  audios: SentenceAudio[];
  translations: [{
    is_direct: boolean;
    id: number;
    text: string;
    lang: string|null;
    script: string|null;
    license: string;
    owner: string|null;
    transcriptions: SentenceTranscription[];
    audios: SentenceAudio[];
  }]
}

export type SentenceTranscription = {
  text: string;
  script: string;
  needsReview: boolean;
  type: string;
  html: string;
  editor: string|null;
  modified: Date;
};

export type SentenceAudio = {
  id: number;
  author: string;
  licence: string;
  attribution_url: string;
  download_url: string;
  created: Date;
  modified: Date;
}

export type SentencePaging = {
  first: string;
  total: number;
  has_next: boolean;
  cursor_end: string;
  next: string;
}
