export { sendQuestion, translateText, processDocument, type TutorResponse } from './services/api';
export { setOfflineModelPath, generateOfflineAnswer } from './services/offlineTutor';
export { llamaBridge } from './services/nativeLlama';
export {
  detectMathExpression,
  solveMathDetection,
  type MathDetection,
  type MathSolution,
} from './services/mathSolver';
export { OCRService, type OCRResult } from './services/ocrService';
export {
  detectLanguageRequest,
  translateAssistantResponse,
  type LanguageRequest,
} from './services/mlKitTranslation';
export {
  SpeechToTextService,
  INDIAN_LANGUAGES,
  LANGUAGE_CODES,
  type SpeechRecognitionState,
} from './services/speechToText';
export {
  getDefaultModelId,
  hasDownloadedModel,
  getModels,
  getActiveModel,
  getActiveModelPath,
  setActiveModel,
  downloadModel,
  deleteModelFile,
  type Model,
} from './services/modelDownloadService';
