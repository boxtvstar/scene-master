
export enum AppMode {
  EDIT = 'EDIT',
  CINEMA = 'CINEMA',
  GALLERY = 'GALLERY',
  PROCESS = 'PROCESS' // 이미지 분할 및 편집 기능
}

export enum ResultMode {
  GRID = 'GRID', // 3*3 그리드
  INDIVIDUAL = 'INDIVIDUAL' // 9장 개별 이미지
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  WIDE = '21:9',
  PHOTO_34 = '3:4',
  PHOTO_43 = '4:3',
  ORIGINAL = 'ORIGINAL'
}

export enum Resolution {
  RES_2K = '2K',
  RES_4K = '4K'
}

export interface StoryboardCut {
  id: string;
  imageUrl: string;
  caption: string;
  prompt: string;
  projectId: string; // 소속 프로젝트 ID
}

export interface StoryboardProject {
  id: string;
  name: string;
  timestamp: number;
  baseImageUrl: string;
  cuts: StoryboardCut[];
  template: string;
  resultMode: ResultMode;
}

export interface EditParams {
  rotation: number;
  tilt: number;
  zoom: number;
  denoising: number;
  expression: string;
  shotSize: string;
  customPrompt: string;
}

export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
}
