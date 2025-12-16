import { AppState, FontFamily, User, Order, Signature } from './types';

export const INITIAL_STATE: AppState = {
  branding: {
    logoUrl: 'https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png',
    primaryColor: '#4f46e5', // indigo-600
    secondaryColor: '#0f172a', // slate-900
    fontFamily: FontFamily.SANS,
    logoWidth: 76, // Tamanho fixo solicitado
    logoAlignment: 'left',
    watermark: {
      enabled: false,
      imageUrl: null,
      opacity: 20, // Opacidade padrão solicitada
      size: 55,    
      grayscale: true 
    }
  },
  document: {
    headerText: 'São José do Goiabal - MG', // Apenas a cidade, conforme solicitado
    footerText: 'ENDEREÇO: Praça Cônego João Pio, 30 - Centro – 35.986-000\nSão José do Goiabal-MG. CNPJ: 18.402.552/0001-91', // Texto solicitado em duas linhas
    showDate: true,
    showPageNumbers: true,
    showSignature: false, // Padrão desligado
    titleStyle: {
      size: 10, // Tamanho solicitado (pt)
      color: '#131216', // Cor solicitada
      alignment: 'left'
    }
  },
  content: {
    title: 'Pedido de Compra #001',
    body: `Descreva aqui os detalhes do seu pedido, justificativa e especificações técnicas.
    
O sistema formatará este texto automaticamente respeitando a identidade visual da empresa.`,
    signatureName: '',
    signatureRole: '',
    signatureSector: ''
  },
  ui: {
    homeLogoUrl: 'https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png',
    homeLogoHeight: 56, // Equivalente a h-14 (14 * 4px)
    homeLogoPosition: 'left'
  }
};

export const FONT_OPTIONS = [
  { label: 'Moderna (Inter)', value: FontFamily.SANS },
  { label: 'Clássica (Merriweather)', value: FontFamily.SERIF },
  { label: 'Técnica (Roboto Mono)', value: FontFamily.MONO },
];

export const MOCK_SIGNATURES: Signature[] = [
  { id: 'sig1', name: 'Maria Doroteia Dias Lemos', role: 'Chefe De Gabinete', sector: 'Gabinete do Prefeito' },
  { id: 'sig2', name: 'Ailton Geraldo Dos Santos', role: 'Prefeito Municipal', sector: '' },
  { id: 'sig3', name: 'Guilherme Araújo Ferreira dos Santos', role: 'Secretário Administrativo Municipal', sector: 'Administração Municipal' }
];

export const DEFAULT_USERS: User[] = [
  { 
    id: '1', 
    username: 'guilherme.santos', 
    password: 'Gafds.086', 
    name: 'Guilherme Araújo Ferreira dos Santos', 
    role: 'admin', 
    sector: 'Administração Municipal', 
    jobTitle: 'Secretário Administrativo Municipal', 
    allowedSignatureIds: ['sig1', 'sig2', 'sig3'] // Admin tem acesso a todas
  },
  { 
    id: '2', 
    username: 'juliana.miranda', 
    password: '123456', 
    name: 'Juliana Miranda Vasconcelos Almeida', 
    role: 'collaborator', 
    sector: 'Administração', 
    jobTitle: 'Tecnico Administrativo', 
    allowedSignatureIds: ['sig3', 'sig2'] // Acesso ao secretário e prefeito
  },
  { 
    id: '3', 
    username: 'doroteia.lemos', 
    password: '123456', 
    name: 'Maria Doroteia Dias Lemos', 
    role: 'collaborator', 
    sector: 'Gabinete do Prefeito', 
    jobTitle: 'Chefe De Gabinete', 
    allowedSignatureIds: ['sig1', 'sig2'] // Acesso a própria e prefeito
  },
];

export const MOCK_ORDERS: Order[] = [
  { id: '101', protocol: '#REQ-2024-0042', title: 'Aquisição de Notebooks', status: 'completed', createdAt: '2024-02-15', userId: '2', userName: 'Juliana Miranda' },
  { id: '102', protocol: '#REQ-2024-0043', title: 'Material de Escritório', status: 'pending', createdAt: '2024-02-16', userId: '2', userName: 'Juliana Miranda' },
  { id: '103', protocol: '#REQ-2024-0044', title: 'Licença de Software', status: 'pending', createdAt: '2024-02-17', userId: '1', userName: 'Guilherme Araújo' },
  { id: '104', protocol: '#REQ-2024-0045', title: 'Serviço de Limpeza', status: 'canceled', createdAt: '2024-02-14', userId: '99', userName: 'Outro Usuário' },
];