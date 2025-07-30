export interface OpenRouteServiceResponse {
  type: string;
  features: Array<{
    bbox: [number, number, number, number];
    type: string;
    properties: {
      segments: Array<{
        distance: number;
        duration: number;
        steps: Array<{
          distance: number;
          duration: number;
          type: number;
          instruction: string;
          name: string;
          way_points: [number, number];
        }>;
      }>;
      summary: {
        distance: number;
        duration: number;
      };
      way_points: [number, number];
    };
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
  }>;
  bbox: [number, number, number, number];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: [number, number][];
      profile: string;
      format: string;
    };
    engine: {
      version: string;
      build_date: string;
      graph_date: string;
    };
  };
}

export interface OpenRouteServiceError {
  error: {
    code: number;
    message: string;
  };
}