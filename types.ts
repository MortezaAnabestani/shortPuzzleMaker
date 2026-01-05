
export enum ArtStyle {
  MANDALA = 'Detailed Mandala',
  STAINED_GLASS = 'Stained Glass Art',
  CYBERPUNK = 'Cyberpunk Illustration',
  WATERCOLOR = 'Professional Watercolor',
  ANIME = 'High-End Anime Scene',
  OIL_PAINTING = 'Classical Oil Painting',
  VECTOR_ART = 'Clean Vector Art',
  HYPER_REALISTIC = 'Hyper-Realistic Photo'
}

export enum PieceShape {
  SQUARE = 'Square',
  TRIANGLE = 'Triangle',
  HEXAGON = 'Hexagon',
  DIAMOND = 'Diamond',
  BRICK = 'Brick/Rectangle',
  CHEVRON = 'Chevron',
  JIGSAW = 'True Interlocking'
}

export enum PieceMaterial {
  CARDBOARD = 'Classic Cardboard',
  WOOD = 'Polished Oak',
  GLASS = 'Frosted Glass',
  CARBON = 'Carbon Fiber'
}

export enum MovementType {
  STANDARD = 'Realistic',
  FLIGHT = 'Flight (Swoop)',
  WAVE = 'Ocean Wave',
  PLAYFUL = 'Bouncy Playful',
  VORTEX = 'Spiral Vortex',
  ELASTIC = 'Elastic Pop'
}

export enum PuzzleBackground {
  FROSTED_DISCOVERY = 'Frosted Discovery'
}

export enum TopicType {
  BREAKING = 'Breaking Signal',
  VIRAL = 'Viral Trend',
  MANUAL = 'Custom Entry',
  NARRATIVE = 'Historical Discovery'
}

export enum StorySource {
  AI_DISCOVERY = 'AI_DISCOVERY',
  TOPIC_GUIDE = 'TOPIC_GUIDE',
  DIRECT_PROMPT = 'DIRECT_PROMPT'
}

export interface PuzzleState {
  isGenerating: boolean;
  isSolving: boolean;
  isRecording: boolean;
  progress: number;
  imageUrl: string | null;
  error: string | null;
}

export interface UserPreferences {
  style: ArtStyle;
  subject: string;
  durationMinutes: number;
  pieceCount: number;
  shape: PieceShape;
  material: PieceMaterial;
  movement: MovementType;
  background: PuzzleBackground;
  topicType?: TopicType;
  topicCategory?: string;
  showDocumentaryTips?: boolean;
}
