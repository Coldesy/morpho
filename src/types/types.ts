// ============================================================
// Morpho 2.0 — Shared Types
// ============================================================

/** Result from concept analysis */
export interface ConceptAnalysis {
  concept: string;
  category: string;
  components: string[];
  structural_description: string;
  similar_objects: string[];
  geometry_type: string;
  complexity: string;
}

/** Sketchfab model metadata */
export interface SketchfabModel {
  uid: string;
  name: string;
  description: string;
  model_url: string;
  embed_url: string;
  preview_url: string;
  polygon_count: number;
  tags: string[];
  author: string;
  is_downloadable: boolean;
}

/** Validation result for a single model */
export interface ModelValidation {
  model_id: string;
  relevance_score: number;
  structural_accuracy: number;
  educational_usefulness: number;
  explanation: string;
}

/** Primitive shape descriptor for fallback composition */
export interface PrimitiveShape {
  type: 'sphere' | 'cylinder' | 'cone' | 'torus' | 'box' | 'ring';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  label?: string;
}

/** Primitive composition config (fallback rendering) */
export interface PrimitiveComposition {
  shapes: PrimitiveShape[];
  description: string;
}

/** Scene object generated from paragraph */
export interface SceneObject {
  name: string;
  position: [number, number, number];
}

export interface SceneRelationship {
  type: string;
  source: string;
  target: string;
}

export interface SceneComposition {
  objects: SceneObject[];
  relationships: SceneRelationship[];
}

/** Source types */
export type ModelSource = 'sketchfab' | 'tripo' | 'primitive' | 'semantic_fallback' | 'scene';

/** Educational breakdown for the concept panel */
export interface EducationalBreakdown {
  overview: string;
  components_explanation: { name: string; description: string }[];
  how_it_works: string;
}

/** Full pipeline result */
export interface PipelineResult {
  query_id: string;
  concept: ConceptAnalysis;
  source: ModelSource;
  model_url?: string;
  model_uid?: string;
  embed_url?: string;
  preview_url?: string;
  confidence: number;
  explanation: string;
  primitiveConfig?: PrimitiveComposition;
  sceneConfig?: SceneComposition;
  author?: string;
  polygon_count?: number;
  tags?: string[];
  /** Morpho 2.0 additions */
  cached?: boolean;
  pipeline_time_ms?: number;
  educational_breakdown?: EducationalBreakdown;
}

/** Pipeline step for progress tracking */
export type PipelineStep =
  | 'analyzing'
  | 'searching'
  | 'validating'
  | 'generating'
  | 'rendering'
  | 'complete'
  | 'error';

/** Pipeline progress event */
export interface PipelineProgress {
  step: PipelineStep;
  message: string;
  data?: unknown;
}
