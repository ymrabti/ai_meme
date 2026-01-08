
export interface MemeState {
  imageUrl: string | null;
  topText: string;
  bottomText: string;
  fontSize: number;
  textColor: string;
}

export interface Suggestion {
  top: string;
  bottom: string;
}

export interface Template {
  id: string;
  name: string;
  url: string;
}

export enum AppStatus {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  EDITING = 'editing',
  ERROR = 'error'
}
