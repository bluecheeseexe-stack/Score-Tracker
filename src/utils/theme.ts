import { ThemeOption } from '../types';

export interface ThemeConfig {
  id: ThemeOption;
  name: string;
  dotColor: string;
  tagline: string;
  canvasBg: string;
  cardBg: string;
  cardBorder: string;
  textHeading: string;
  textBody: string;
  textMuted: string;
  primaryBtn: string;
  secondaryBtn: string;
  accentText: string;
  progressBar: string;
  statCardBg: string;
  badgePassed: string;
  badgeBelow: string;
  inputBg: string;
  tagActiveBg: string;
}

export const THEMES: Record<ThemeOption, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Vibrant Emerald',
    dotColor: '#16a34a',
    tagline: 'Review Emerald Green',
    canvasBg: 'bg-[#f2f9f3]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#c6e2cb]',
    textHeading: 'text-[#14532d]',
    textBody: 'text-[#19351e]',
    textMuted: 'text-[#416847]',
    primaryBtn: 'bg-[#15803d] hover:bg-[#166534] text-white shadow-xs',
    secondaryBtn: 'bg-white border-[#c6e2cb] text-[#166534] hover:bg-[#ebf6ee]',
    accentText: 'text-[#15803d]',
    progressBar: 'bg-[#16a34a]',
    statCardBg: 'bg-white',
    badgePassed: 'bg-[#ecfdf5] text-[#166534] border-[#a7f3d0]',
    badgeBelow: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
    inputBg: 'bg-[#f8fcf8] border-[#c6e2cb] text-[#19351e]',
    tagActiveBg: 'bg-[#15803d] text-white border-[#15803d]',
  },
  forest: {
    id: 'forest',
    name: 'Forest Scholar',
    dotColor: '#0f3822',
    tagline: 'Deep Pine & Gold',
    canvasBg: 'bg-[#fbfaf6]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#dfd8cc]',
    textHeading: 'text-[#0f3822]',
    textBody: 'text-[#1c281e]',
    textMuted: 'text-[#5b6859]',
    primaryBtn: 'bg-[#0f3822] hover:bg-[#082415] text-[#fcfbf7] shadow-xs',
    secondaryBtn: 'bg-white border-[#dfd8cc] text-[#0f3822] hover:bg-[#f6f2eb]',
    accentText: 'text-[#0f3822]',
    progressBar: 'bg-[#1b5e3b]',
    statCardBg: 'bg-white',
    badgePassed: 'bg-[#ecfdf5] text-[#0f3822] border-[#bcd4be]',
    badgeBelow: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
    inputBg: 'bg-[#faf8f4] border-[#dfd8cc] text-[#1c281e]',
    tagActiveBg: 'bg-[#0f3822] text-white border-[#0f3822]',
  },
  sage: {
    id: 'sage',
    name: 'Editorial Sage',
    dotColor: '#4a634a',
    tagline: 'Minimalist Olive',
    canvasBg: 'bg-[#f2f4f2]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#d8ded8]',
    textHeading: 'text-[#4a634a]',
    textBody: 'text-[#2d332d]',
    textMuted: 'text-[#6e806e]',
    primaryBtn: 'bg-[#4a634a] hover:bg-[#3d523d] text-white shadow-xs',
    secondaryBtn: 'bg-white border-[#d8ded8] text-[#2d332d] hover:bg-[#f2f4f2]',
    accentText: 'text-[#4a634a]',
    progressBar: 'bg-[#4a634a]',
    statCardBg: 'bg-white',
    badgePassed: 'bg-white text-[#4a634a] border-[#4a634a]',
    badgeBelow: 'bg-white text-red-800 border-red-800',
    inputBg: 'bg-[#fafafa] border-[#d8ded8] text-[#2d332d]',
    tagActiveBg: 'bg-[#4a634a] text-white border-[#4a634a]',
  },
};
