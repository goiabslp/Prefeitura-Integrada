
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
  city: string;
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
  subType?: 'diaria' | 'custeio';
  showDiariaSignatures?: boolean;
  showExtraField?: boolean;
  extraFieldText?: string;
  // Campos específicos para Diárias e Custeio
  requesterName?: string;
  requesterRole?: string;
  requesterSector?: string;
  destination?: string;
  departureDateTime?: string;
  returnDateTime?: string;
  lodgingCount?: number;
  authorizedBy?: string;
  distanceKm?: number;
  requestedValue?: string;
  descriptionReason?: string;
  paymentForecast?: string;
}

export interface UIConfig {
  loginLogoUrl: string | null;
  loginLogoHeight: number;
  headerLogoUrl: string | null;
  headerLogoHeight: number;
  homeLogoPosition: 'left' | 'center';
}

export interface AppState {
  branding: BrandingConfig;
  document: DocumentConfig;
  content: ContentData;
  ui: UIConfig;
}

export type UserRole = 'admin' | 'collaborator' | 'licitacao';

export type AppPermission = 'parent_criar_oficio' | 'parent_admin' | 'parent_compras' | 'parent_licitacao' | 'parent_diarias';

export type BlockType = 'oficio' | 'compras' | 'licitacao' | 'diarias';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  sector?: string;
  jobTitle?: string;
  allowedSignatureIds?: string[];
  permissions: AppPermission[];
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
  blockType: BlockType;
  documentSnapshot?: AppState;
}
