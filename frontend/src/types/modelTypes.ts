interface FeatureImportance {
  feature: string;
  importance: number;
}
interface ChampionMetrics {
  r2_score: number;
  mae: number;
}
export interface ChampionData {
  model_version: string;
  run_id: string;
  last_updated: string;
  metrics: ChampionMetrics;
  top_features: FeatureImportance[];
}
