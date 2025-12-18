
import { AppState, FontFamily, User, Order, Signature } from './types';

export const INITIAL_STATE: AppState = {
  branding: {
    logoUrl: 'https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png',
    primaryColor: '#4f46e5',
    secondaryColor: '#0f172a',
    fontFamily: FontFamily.SANS,
    logoWidth: 76,
    logoAlignment: 'left',
    watermark: {
      enabled: false,
      imageUrl: null,
      opacity: 20,
      size: 55,    
      grayscale: true 
    }
  },
  document: {
    headerText: 'São José do Goiabal - MG',
    footerText: 'ENDEREÇO: Praça Cônego João Pio, 30 - Centro – 35.986-000\nSão José do Goiabal-MG. CNPJ: 18.402.552/0001-91',
    showDate: true,
    showPageNumbers: true,
    showSignature: false,
    showLeftBlock: false,
    showRightBlock: false,
    titleStyle: {
      size: 10,
      color: '#131216',
      alignment: 'left'
    },
    leftBlockStyle: {
      size: 10,
      color: '#131216'
    },
    rightBlockStyle: {
      size: 10,
      color: '#131216'
    }
  },
  content: {
    title: 'Ofício nº 001/2024',
    body: `Descreva aqui os detalhes do seu documento.`,
    signatureName: '',
    signatureRole: '',
    signatureSector: '',
    leftBlockText: 'Ofício nº 001/2024\nAssunto: Solicitação de Material',
    rightBlockText: 'Ao Excelentíssimo Senhor\nPrefeito Municipal de São José do Goiabal\nNesta Cidade'
  },
  ui: {
    homeLogoUrl: 'https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png',
    homeLogoHeight: 56,
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
    username: 'a', 
    password: 'a', 
    name: 'Guilherme Araújo Ferreira dos Santos', 
    role: 'admin', 
    sector: 'Administração Municipal', 
    jobTitle: 'Secretário Administrativo Municipal', 
    allowedSignatureIds: ['sig1', 'sig2', 'sig3'],
    permissions: ['parent_criar_oficio', 'parent_admin', 'parent_compras', 'parent_licitacao']
  },
  { 
    id: '2', 
    username: 'juliana.miranda', 
    password: '123456', 
    name: 'Juliana Miranda Vasconcelos Almeida', 
    role: 'collaborator', 
    sector: 'Administração', 
    jobTitle: 'Tecnico Administrativo', 
    allowedSignatureIds: ['sig3', 'sig2'],
    permissions: ['parent_criar_oficio', 'parent_compras']
  },
  { 
    id: '3', 
    username: 'doroteia.lemos', 
    password: '123456', 
    name: 'Maria Doroteia Dias Lemos', 
    role: 'collaborator', 
    sector: 'Gabinete do Prefeito', 
    jobTitle: 'Chefe De Gabinete', 
    allowedSignatureIds: ['sig1', 'sig2'],
    permissions: ['parent_criar_oficio']
  },
];

export const MOCK_ORDERS: Order[] = [];
