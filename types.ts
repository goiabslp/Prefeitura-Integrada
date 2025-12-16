
export enum FontFamily {
  SANS = 'font-sans',
  SERIF = 'font-serif',
  MONO = 'font-mono'
}

export type LogoAlignment = 'left' | 'center' | 'right';

export interface WatermarkConfig {
  enabled: boolean;
  imageUrl: string | null; // Se null, usa o logo principal
  opacity: number; // 0 a 100
  size: number; // Porcentagem da largura da página (10 a 100)
  grayscale: boolean; // Novo campo para converter em P&B
}

export interface BrandingConfig {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  logoWidth: number; // Largura em mm (visual e pdf)
  logoAlignment: LogoAlignment;
  watermark: WatermarkConfig;
}

export interface TitleStyle {
  size: number; // em pt
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface DocumentConfig {
  headerText: string;
  footerText: string;
  showDate: boolean;
  showPageNumbers: boolean;
  showSignature: boolean; // Novo campo
  titleStyle: TitleStyle;
}

export interface ContentData {
  title: string;
  body: string;
  signatureName: string;
  signatureRole: string;
  signatureSector: string;
}

// Novo Módulo de Interface
export interface UIConfig {
  homeLogoUrl: string | null;
  homeLogoHeight: number; // Altura em pixels (px)
  homeLogoPosition: 'left' | 'center';
}

export interface AppState {
  branding: BrandingConfig;
  document: DocumentConfig;
  content: ContentData;
  ui: UIConfig; // Adicionado ao estado global
}

// Novos tipos para Autenticação e Controle de Acesso
export type UserRole = 'admin' | 'collaborator' | 'licitacao';

export interface User {
  id: string;
  username: string;
  password?: string; // Opcional na listagem
  name: string;
  role: UserRole;
  sector?: string; // Novo campo para setor/departamento
  jobTitle?: string; // Novo campo para Cargo
  allowedSignatureIds?: string[]; // IDs das assinaturas permitidas
}

// Nova interface para Assinaturas
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
  userId: string; // ID do usuário que criou
  userName: string;
}