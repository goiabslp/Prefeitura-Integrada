
import { AppState, FontFamily, User, Order, Signature } from './types';

export const INITIAL_STATE: AppState = {
  branding: {
    logoUrl: null,
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
    city: 'São José do Goiabal - MG',
    showDate: true,
    showPageNumbers: true,
    showSignature: false,
    showLeftBlock: true,
    showRightBlock: true,
    titleStyle: {
      size: 12,
      color: '#131216',
      alignment: 'left'
    },
    leftBlockStyle: {
      size: 10,
      color: '#191822'
    },
    rightBlockStyle: {
      size: 10,
      color: '#191822'
    }
  },
  content: {
    title: 'Ofício nº 001/2024',
    body: `Cumprimentando-o cordialmente, vimos por meio deste solicitar a Vossa Senhoria o que segue:\n\nEscreva aqui o detalhamento da sua solicitação, pedido ou comunicado de forma clara e objetiva. O texto agora utiliza quebras de linha nativas (Enter).\n\nCertos de contarmos com vossa costumeira atenção, antecipamos nossos sinceros agradecimentos e renovamos nossos votos de estima e consideração.\n\nAtenciosamente,`,
    signatureName: '',
    signatureRole: '',
    signatureSector: '',
    leftBlockText: 'Ofício nº 001/2024\nAssunto: Solicitação de Material',
    rightBlockText: 'Ao Excelentíssimo Senhor\nPrefeito Municipal de São José do Goiabal\nNesta Cidade',
    purchaseItems: [],
    priority: 'Normal',
    priorityJustification: ''
  },
  ui: {
    loginLogoUrl: null,
    loginLogoHeight: 80,
    headerLogoUrl: null,
    headerLogoHeight: 40,
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
  { id: 'sig3', name: 'Guilherme Araújo Ferreira dos Santos', role: 'Secretário Administrativo Municipal', sector: 'Administração Municipal' },
  { id: 'sig4', name: 'Tamires Araújo Rufino', role: 'Assitente Social - CRESS MG 33.870', sector: 'EMulti e Proteção Especial' }
];

export const DEFAULT_USERS: User[] = [
  { 
    id: '1', 
    username: 'GAF', 
    password: 'GAF', 
    name: 'Guilherme Araújo (GAF)', 
    role: 'admin', 
    sector: 'Administração Municipal', 
    jobTitle: 'Secretário Municipal', 
    allowedSignatureIds: ['sig1', 'sig2', 'sig3', 'sig4'],
    permissions: ['parent_criar_oficio', 'parent_admin', 'parent_compras', 'parent_licitacao', 'parent_diarias', 'parent_compras_pedidos']
  },
  { 
    id: 'user_juliana', 
    username: 'jmv', 
    password: 'jmv', 
    name: 'Juliana Miranda Vasconcelos', 
    role: 'admin', 
    sector: 'Secretaria de Administração', 
    jobTitle: 'Tecnico Administrativo', 
    allowedSignatureIds: ['sig1', 'sig2', 'sig3'],
    permissions: ['parent_criar_oficio', 'parent_admin', 'parent_compras', 'parent_diarias', 'parent_compras_pedidos']
  },
  { 
    id: 'user_licitacao', 
    username: 'licitacao', 
    password: '123', 
    name: 'Operador de Licitação', 
    role: 'licitacao', 
    sector: 'Setor de Licitação', 
    jobTitle: 'Analista de Licitação', 
    allowedSignatureIds: [],
    permissions: ['parent_criar_oficio', 'parent_compras', 'parent_licitacao', 'parent_diarias', 'parent_compras_pedidos']
  },
  { 
    id: 'user_compras', 
    username: 'compras', 
    password: '123', 
    name: 'Responsável Compras', 
    role: 'compras', 
    sector: 'Setor de Compras', 
    jobTitle: 'Analista de Compras', 
    allowedSignatureIds: [],
    permissions: ['parent_criar_oficio', 'parent_compras', 'parent_licitacao', 'parent_diarias', 'parent_compras_pedidos']
  },
  { 
    id: '2', 
    username: 'colaborador', 
    password: '123', 
    name: 'Colaborador Padrão', 
    role: 'collaborator', 
    sector: 'Secretaria Geral', 
    jobTitle: 'Técnico Administrativo', 
    allowedSignatureIds: [],
    permissions: ['parent_criar_oficio', 'parent_compras', 'parent_diarias']
  }
];

export const MOCK_ORDERS: Order[] = [];
