
export enum FontFamily {
  SANS = 'font-sans',
  SERIF = 'font-serif',
  MONO = 'font-mono'
}

export type LogoAlignment = 'left' | 'center' | 'right';

export interface WatermarkConfig {
  enabled: boolean;
  imageUrl: string | null;
  opacity: number;
  size: number;
  grayscale: boolean;
}

export interface BrandingConfig {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  logoWidth: number;
  logoAlignment: LogoAlignment;
  watermark: WatermarkConfig;
}

export interface TextStyle {
  size: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface DocumentConfig {
  headerText: string;
  footerText: string;
  showDate: boolean;
  showPageNumbers: boolean;
  showSignature: boolean;
  showLeftBlock: boolean;
  showRightBlock: boolean;
  titleStyle: TextStyle;
  leftBlockStyle: {
    size: number;
    color: string;
  };
  rightBlockStyle: {
    size: number;
    color: string;
  };
}

export interface ContentData {
  title: string;
  body: string;
  signatureName: string;
  signatureRole: string;
  signatureSector: string;
  leftBlockText: string;
  rightBlockText: string;
}

export interface UIConfig {
  homeLogoUrl: string | null;
  homeLogoHeight: number;
  homeLogoPosition: 'left' | 'center';
}

export interface AppState {
  branding: BrandingConfig;
  document: DocumentConfig;
  content: ContentData;
  ui: UIConfig;
}

export type UserRole = 'admin' | 'collaborator' | 'licitacao';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  sector?: string;
  jobTitle?: string;
  allowedSignatureIds?: string[];
}

export interface Signature {
  id: string;
  name: string;
  role: string;
  sector: string;
}

export interface Order {
  id: string;
  protocol: string;
  title: string;
  status: 'pending' | 'completed' | 'canceled';
  createdAt: string;
  userId: string;
  userName: string;
}
