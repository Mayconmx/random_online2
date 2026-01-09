export enum Page {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  CHAT = 'CHAT',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY'
}

export interface User {
  id: string;
  email: string;
  username: string;
  country?: string;
}

// Extend Window to include PeerJS since we load it via CDN
declare global {
  interface Window {
    Peer: any;
    webkitAudioContext: typeof AudioContext;
  }
}

export interface ChatState {
  status: 'idle' | 'searching' | 'connected' | 'skipping' | 'error';
  partnerLocation: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  errorMessage: string | null;
}

export enum FilterType {
  NORMAL = 'normal',
  NOIR = 'noir',
  SEPIA = 'sepia',
  CYBER = 'cyber',
  VIGNETTE = 'vignette',
  BLUR = 'blur',
  INVERT = 'invert'
}

export enum AudioFilterType {
  NORMAL = 'normal',
  ECHO = 'echo',
  ROBOT = 'robot',
  PHONE = 'phone',
  DEEP = 'deep'
}