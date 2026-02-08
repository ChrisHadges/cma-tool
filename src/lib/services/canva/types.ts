export interface CanvaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface CanvaBrandTemplate {
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  createUrl: string;
}

export interface CanvaTemplateDatasetField {
  name: string;
  type: "text" | "image";
  required?: boolean;
}

export interface CanvaTemplateDataset {
  fields: Record<string, CanvaTemplateDatasetField>;
}

export interface CanvaDesign {
  id: string;
  title: string;
  url: string;
  editUrl: string;
  viewUrl: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CanvaAutofillData {
  [fieldName: string]: {
    type: "text";
    text: string;
  } | {
    type: "image";
    asset_id: string;
  };
}

export interface CanvaExportFormat {
  type: "pdf" | "jpg" | "png" | "pptx" | "gif" | "mp4";
  quality?: "standard" | "high";
  pages?: number[];
}

export interface CanvaExportResult {
  downloadUrl: string;
  downloadUrls: string[];
  format: string;
}

export interface CanvaGenerateCandidate {
  candidateId: string;
  thumbnail: string;
  url: string;
}

export interface CanvaGenerateResult {
  jobId: string;
  candidates: CanvaGenerateCandidate[];
}
