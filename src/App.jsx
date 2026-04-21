import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { ShoppingBag, ShoppingCart, Plus, Minus, Bell, Store, CheckCircle2, User, MapPin, Phone, Trash2, Search, Package, Eye, EyeOff, Sparkles, ChefHat, MessageCircle, Settings, LogIn, LogOut, ShieldCheck, X, Clock, Info } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// ============================================================================
// BLOCO 1: CONFIGURAÇÕES E DADOS BASE
// ============================================================================

const apiKey = ""; // A chave do Gemini é injetada automaticamente

// --- SETUP FIREBASE AUTH (COM AS SUAS CHAVES DIRETAS) ---
let auth, provider;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyCXjyBVLbzojhMmpGJ81BzjmvgqOEILYcI",
    authDomain: "amplified-alpha-465208-n8.firebaseapp.com",
    projectId: "amplified-alpha-465208-n8",
    storageBucket: "amplified-alpha-465208-n8.firebasestorage.app",
    messagingSenderId: "986465642868",
    appId: "1:986465642868:web:b084a9c27eda0a5e176421",
    measurementId: "G-LDGPRLZ8EM"
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
} catch(e) {
  console.error("Erro ao inicializar Firebase", e);
}

// OS DOIS ÚNICOS EMAILS COM PERMISSÃO:
const ALLOWED_ADMINS = ['mightyrem@gmail.com', 'hmtuga@gmail.com'];

// --- FUNÇÃO GEMINI API ---
const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "És o Mário, o dono simpático e experiente de uma frutaria tradicional portuguesa chamada 'Frutário'. Adoras dar dicas sobre frutas e nutrição aos teus clientes de forma alegre. Falas exclusivamente em português de Portugal." }] }
  };

  const fetchWithRetry = async (retries = 5, delay = 1000) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui pensar em nada agora!";
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      }
      throw error;
    }
  };
  return fetchWithRetry();
};

// --- FUNÇÕES UTILITÁRIAS ---
const formatQuantity = (qty, type) => {
  if (type === 'kg') return `${qty.toFixed(2)}`;
  
  const whole = Math.floor(qty);
  const fraction = qty - whole;
  let fractionStr = '';
  
  if (Math.abs(fraction - 0.25) < 0.01) fractionStr = '¼';
  else if (Math.abs(fraction - 0.5) < 0.01) fractionStr = '½';
  else if (Math.abs(fraction - 0.75) < 0.01) fractionStr = '¾';
  else if (fraction > 0) return qty.toFixed(2);
  
  if (whole === 0 && fractionStr) return fractionStr;
  if (whole > 0 && fractionStr) return `${whole} ${fractionStr}`;
  return `${whole}`;
};

// --- BASE DE DADOS DE FRUTAS ---
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Tomate Cherry', category: 'Hortícolas e Outros', img: 'fotos_frutas_jpg/tomate_cherry.jpg', priceKg: 3.50, priceUnit: 1.50, unitName: 'caixa 250g' },
  { id: 2, name: 'Kiwi Gold', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/kiwi_gold.jpg', priceKg: 5.90, priceUnit: 0.80, unitName: 'unid.' },
  { id: 3, name: 'Limão', category: 'Citrinos', img: 'fotos_frutas_jpg/limao.jpg', priceKg: 1.60, priceUnit: 0.25, unitName: 'unid.' },
  { id: 4, name: 'Mamão', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/mamao.jpg', priceKg: 3.80, priceUnit: 2.50, unitName: 'unid.' },
  { id: 5, name: 'Manga Avião', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/manga_aviao.jpg', priceKg: 5.90, priceUnit: 2.50, unitName: 'unid.' },
  { id: 6, name: 'Mirtilos', category: 'Frutos Vermelhos', img: 'fotos_frutas_jpg/mirtilos.jpg', priceKg: null, priceUnit: 2.00, unitName: 'caixa 125g' },
  { id: 7, name: 'Papaias', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/papaias.jpg', priceKg: 4.20, priceUnit: 2.80, unitName: 'unid.' },
  { id: 8, name: 'Nozes', category: 'Frutos Secos', img: 'fotos_frutas_jpg/nozes.jpg', priceKg: 6.50, priceUnit: null, unitName: 'kg' },
  { id: 9, name: 'Abacate', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/abacate.jpg', priceKg: 4.50, priceUnit: 1.20, unitName: 'unid.' },
  { id: 10, name: 'Abacaxi Avião', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/abacaxi_aviao.jpg', priceKg: 2.50, priceUnit: 4.50, unitName: 'unid.' },
  { id: 11, name: 'Abacaxi Angola', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/abacaxi_angola.jpg', priceKg: 2.80, priceUnit: 5.00, unitName: 'unid.' },
  { id: 12, name: 'Anona', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/anona.jpg', priceKg: 4.90, priceUnit: 1.50, unitName: 'unid.' },
  { id: 13, name: 'Framboesa', category: 'Frutos Vermelhos', img: 'fotos_frutas_jpg/framboesa.jpg', priceKg: null, priceUnit: 2.50, unitName: 'caixa 125g' },
  { id: 14, name: 'Banana', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/banana.jpg', priceKg: 1.20, priceUnit: 0.20, unitName: 'unid.' },
  { id: 15, name: 'Banana Madeira', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/banana_madeira.jpg', priceKg: 1.49, priceUnit: 0.25, unitName: 'unid.' },
  { id: 16, name: 'Maçã Golden', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_golden.jpg', priceKg: 1.80, priceUnit: 0.30, unitName: 'unid.' },
  { id: 17, name: 'Maçã Gala', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_gala.jpg', priceKg: 1.99, priceUnit: 0.35, unitName: 'unid.' },
  { id: 18, name: 'Maçã Fuji', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_fuji.jpg', priceKg: 2.10, priceUnit: 0.40, unitName: 'unid.' },
  { id: 19, name: 'Batata Doce', category: 'Hortícolas e Outros', img: 'fotos_frutas_jpg/batata_doce.jpg', priceKg: 1.50, priceUnit: null, unitName: 'kg' },
  { id: 20, name: 'Amêndoa com Casca', category: 'Frutos Secos', img: 'fotos_frutas_jpg/amendoa_com_casca.jpg', priceKg: 7.50, priceUnit: null, unitName: 'kg' },
  { id: 21, name: 'Caju', category: 'Frutos Secos', img: 'fotos_frutas_jpg/caju.jpg', priceKg: 14.90, priceUnit: 2.50, unitName: 'saco 150g' },
  { id: 22, name: 'Pistáchio', category: 'Frutos Secos', img: 'fotos_frutas_jpg/pistachio.jpg', priceKg: 15.50, priceUnit: 2.80, unitName: 'saco 150g' },
  { id: 23, name: 'Alhos Secos', category: 'Hortícolas e Outros', img: 'fotos_frutas_jpg/alhos_secos.jpg', priceKg: 4.50, priceUnit: 0.50, unitName: 'cabeça' },
  { id: 24, name: 'Maracujá', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/maracuja.jpg', priceKg: 7.90, priceUnit: 0.80, unitName: 'unid.' },
  { id: 25, name: 'Maçã Granny Smith', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_granny_smith.jpg', priceKg: 2.20, priceUnit: 0.40, unitName: 'unid.' },
  { id: 26, name: 'Figo Seco', category: 'Frutos Secos', img: 'fotos_frutas_jpg/figo_seco.jpg', priceKg: 8.50, priceUnit: 2.50, unitName: 'pacote' },
  { id: 27, name: 'Gengibre', category: 'Hortícolas e Outros', img: 'fotos_frutas_jpg/gengibre.jpg', priceKg: 4.90, priceUnit: null, unitName: 'kg' },
  { id: 28, name: 'Maçã Pink Lady', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_pink_lady.jpg', priceKg: 2.80, priceUnit: 0.50, unitName: 'unid.' },
  { id: 29, name: 'Miolo de Noz', category: 'Frutos Secos', img: 'fotos_frutas_jpg/miolo_de_noz.jpg', priceKg: 12.90, priceUnit: 3.50, unitName: 'pacote 200g' },
  { id: 30, name: 'Pinhão', category: 'Frutos Secos', img: 'fotos_frutas_jpg/pinhao.jpg', priceKg: 45.00, priceUnit: 5.00, unitName: 'pacote 100g' },
  { id: 31, name: 'Maçã Reineta', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_reineta.jpg', priceKg: 2.10, priceUnit: 0.45, unitName: 'unid.' },
  { id: 32, name: 'Cogumelo Branco', category: 'Hortícolas e Outros', img: 'fotos_frutas_jpg/cogumelo_branco.jpg', priceKg: 4.50, priceUnit: 1.50, unitName: 'caixa' },
  { id: 33, name: 'Cogumelo Marron', category: 'Hortícolas e Outros', img: 'fotos_frutas_jpg/cogumelo_marron.jpg', priceKg: 4.90, priceUnit: 1.80, unitName: 'caixa' },
  { id: 34, name: 'Lima', category: 'Citrinos', img: 'fotos_frutas_jpg/lima.jpg', priceKg: 3.50, priceUnit: 0.40, unitName: 'unid.' },
  { id: 35, name: 'Ameixa Rainha Cláudia', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/ameixa_rainha_claudia.jpg', priceKg: 3.90, priceUnit: null, unitName: 'kg' },
  { id: 36, name: 'Figo Pingo Mel', category: 'Outros Frutos', img: 'fotos_frutas_jpg/figo_pingo_mel.jpg', priceKg: 5.50, priceUnit: 0.60, unitName: 'unid.' },
  { id: 37, name: 'Melão Verde', category: 'Melões e Melancias', img: 'fotos_frutas_jpg/melao_verde.jpg', priceKg: 1.80, priceUnit: 3.50, unitName: 'unid.' },
  { id: 38, name: 'Tâmaras', category: 'Frutos Secos', img: 'fotos_frutas_jpg/tamaras.jpg', priceKg: 6.50, priceUnit: 2.50, unitName: 'caixa' },
  { id: 39, name: 'Ameixa Amarela', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/ameixa_amarela.jpg', priceKg: 3.50, priceUnit: null, unitName: 'kg' },
  { id: 40, name: 'Ameixa Vermelha', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/ameixa_vermelha.jpg', priceKg: 3.20, priceUnit: null, unitName: 'kg' },
  { id: 41, name: 'Morango', category: 'Frutos Vermelhos', img: 'fotos_frutas_jpg/morango.jpg', priceKg: null, priceUnit: 3.50, unitName: 'caixa 500g' },
  { id: 42, name: 'Pitaya', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/pitaya.jpg', priceKg: 8.90, priceUnit: 3.50, unitName: 'unid.' },
  { id: 43, name: 'Uva sem Grainha', category: 'Uvas', img: 'fotos_frutas_jpg/uva_sem_grainha.jpg', priceKg: 4.50, priceUnit: null, unitName: 'cacho' },
  { id: 44, name: 'Amora', category: 'Frutos Vermelhos', img: 'fotos_frutas_jpg/amora.jpg', priceKg: null, priceUnit: 2.80, unitName: 'caixa 125g' },
  { id: 45, name: 'Tangerina Encore', category: 'Citrinos', img: 'fotos_frutas_jpg/tangerina_encore.jpg', priceKg: 2.20, priceUnit: 0.30, unitName: 'unid.' },
  { id: 46, name: 'Melancia', category: 'Melões e Melancias', img: 'fotos_frutas_jpg/melancia.jpg', priceKg: 1.10, priceUnit: 9.00, unitName: 'unid.' },
  { id: 47, name: 'Meloa', category: 'Melões e Melancias', img: 'fotos_frutas_jpg/meloa.jpg', priceKg: 2.10, priceUnit: 2.50, unitName: 'unid.' },
  { id: 48, name: 'Maçã Riscadinha', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_riscadinha.jpg', priceKg: 2.40, priceUnit: 0.45, unitName: 'unid.' },
  { id: 49, name: 'Ananás Açores', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/ananas_acores.jpg', priceKg: 3.50, priceUnit: 5.50, unitName: 'unid.' },
  { id: 50, name: 'Uva Red Globe', category: 'Uvas', img: 'fotos_frutas_jpg/uva_red_globe.jpg', priceKg: 3.80, priceUnit: null, unitName: 'cacho' },
  { id: 51, name: 'Pêra Rocha', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/pera_rocha.jpg', priceKg: 2.10, priceUnit: 0.40, unitName: 'unid.' },
  { id: 52, name: 'Maçã Bravo Esmolfe', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_bravo_esmolfe.jpg', priceKg: 2.50, priceUnit: 0.45, unitName: 'unid.' },
  { id: 53, name: 'Marmelo', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/marmelo.jpg', priceKg: 1.90, priceUnit: 0.50, unitName: 'unid.' },
  { id: 54, name: 'Kaki', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/kaki.jpg', priceKg: 3.50, priceUnit: 0.80, unitName: 'unid.' },
  { id: 55, name: 'Maçã Casanova', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/maca_casanova.jpg', priceKg: 1.90, priceUnit: 0.35, unitName: 'unid.' },
  { id: 56, name: 'Romã', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/roma.jpg', priceKg: 3.20, priceUnit: 1.20, unitName: 'unid.' },
  { id: 57, name: 'Laranja', category: 'Citrinos', img: 'fotos_frutas_jpg/laranja.jpg', priceKg: 1.29, priceUnit: 0.20, unitName: 'unid.' },
  { id: 58, name: 'Cereja', category: 'Frutos Vermelhos', img: 'fotos_frutas_jpg/cereja.jpg', priceKg: 6.50, priceUnit: null, unitName: 'kg' },
  { id: 59, name: 'Tângera', category: 'Citrinos', img: 'fotos_frutas_jpg/tangera.jpg', priceKg: 1.80, priceUnit: 0.25, unitName: 'unid.' },
  { id: 60, name: 'Toranja', category: 'Citrinos', img: 'fotos_frutas_jpg/toranja.jpg', priceKg: 2.50, priceUnit: 0.80, unitName: 'unid.' },
  { id: 61, name: 'Tangerina', category: 'Citrinos', img: 'fotos_frutas_jpg/tangerina.jpg', priceKg: 1.90, priceUnit: 0.25, unitName: 'unid.' },
  { id: 62, name: 'Kiwi', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/kiwi.jpg', priceKg: 2.90, priceUnit: 0.40, unitName: 'unid.' },
  { id: 63, name: 'Lichia', category: 'Frutos Tropicais', img: 'fotos_frutas_jpg/lichia.jpg', priceKg: 8.50, priceUnit: 3.50, unitName: 'caixa' },
  { id: 64, name: 'Clementina', category: 'Citrinos', img: 'fotos_frutas_jpg/clementina.jpg', priceKg: 2.10, priceUnit: 0.30, unitName: 'unid.' },
  { id: 65, name: 'Uva Branca', category: 'Uvas', img: 'fotos_frutas_jpg/uva_branca.jpg', priceKg: 3.50, priceUnit: null, unitName: 'cacho' },
  { id: 66, name: 'Pêra Xenia', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/pera_xenia.jpg', priceKg: 2.40, priceUnit: 0.50, unitName: 'unid.' },
  { id: 67, name: 'Nêspera', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/nespera.jpg', priceKg: 4.50, priceUnit: null, unitName: 'kg' },
  { id: 68, name: 'Pêra General', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/pera_general.jpg', priceKg: 2.20, priceUnit: 0.45, unitName: 'unid.' },
  { id: 69, name: 'Pêra Packham', category: 'Maçãs e Peras', img: 'fotos_frutas_jpg/pera_packham.jpg', priceKg: 2.30, priceUnit: 0.45, unitName: 'unid.' },
  { id: 70, name: 'Pêssego Amarelo', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/pessego_amarelo.jpg', priceKg: 2.40, priceUnit: 0.45, unitName: 'unid.' },
  { id: 71, name: 'Pêssego Vermelho', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/pessego_vermelho.jpg', priceKg: 2.60, priceUnit: 0.50, unitName: 'unid.' },
  { id: 72, name: 'Melão Branco', category: 'Melões e Melancias', img: 'fotos_frutas_jpg/melao_branco.jpg', priceKg: 1.90, priceUnit: 3.80, unitName: 'unid.' },
  { id: 73, name: 'Nectarina', category: 'Frutos de Caroço', img: 'fotos_frutas_jpg/nectarina.jpg', priceKg: 2.90, priceUnit: 0.50, unitName: 'unid.' }
];

// --- ESTILOS GLOBAIS ---
const BrandStyles = memo(() => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Kalam:wght@400&display=swap');
    body { background-color: #FFFCF2; color: #451A03; font-family: 'DM Sans', sans-serif; }
    .font-heading { font-family: 'DM Sans', sans-serif; font-weight: 900; letter-spacing: -0.05em; }
    .font-signature { font-family: 'Kalam', cursive; font-weight: 400; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #FFFCF2; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #84CC16; border-radius: 10px; }
  `}} />
));

// ============================================================================
// BLOCO 2: COMPONENTES REUTILIZÁVEIS (UI & MODAIS)
// ============================================================================

const PrivacyPolicyModal = memo(({ onClose }) => (
  <div className="fixed inset-0 z-[200] bg-[#14532D]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-[#FFFCF2] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-white px-6 py-4 border-b border-[#84CC16]/20 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#15803D]" size={28} />
          <h2 className="text-xl font-bold text-[#14532D]">Política de Privacidade e Proteção de Dados</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-[#FFFCF2] text-[#451A03]/50 hover:text-[#EA580C] rounded-full transition">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-[#451A03]/80 space-y-6 text-sm">
        <p>A sua privacidade é uma prioridade para o <strong>Frutário</strong>...</p>
        <div><h3 className="font-bold text-[#14532D] text-base mb-2">1. Responsável pelo Tratamento de Dados</h3><p>O <strong>Frutário</strong> é a entidade responsável...</p></div>
        <div><h3 className="font-bold text-[#14532D] text-base mb-2">2. Dados Recolhidos e Finalidade</h3><ul className="list-disc pl-5 space-y-1"><li><strong>Nome e Contacto Telefónico</strong></li><li><strong>Morada</strong></li></ul></div>
      </div>
      <div className="bg-white px-6 py-5 border-t border-[#84CC16]/20">
        <button onClick={onClose} className="w-full bg-[#15803D] hover:bg-[#14532D] text-[#FFFCF2] py-3.5 rounded-xl font-bold transition shadow-sm">
          Compreendi e Fechar
        </button>
      </div>
    </div>
  </div>
));

const AboutModal = memo(({ onClose }) => (
  <div className="fixed inset-0 z-[200] bg-[#14532D]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-[#FFFCF2] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-white px-6 py-4 border-b border-[#84CC16]/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Store className="text-[#15803D]" size={28} />
          <h2 className="text-xl font-bold text-[#14532D]">A Nossa História</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-[#FFFCF2] text-[#451A03]/50 hover:text-[#EA580C] rounded-full transition">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 md:p-8 text-[#451A03]/90 space-y-4 text-sm sm:text-base leading-relaxed">
        <p>
          Estamos estabelecidos desde 1986. Tudo começou com os nossos pais, <strong>Luís e Fatinha</strong>, que foram servindo os nossos clientes ao longo destes anos sempre com qualidade e simpatia.
        </p>
        <p>
          Sendo agora tempo de passar o testemunho à geração mais nova, mantemos sempre o objetivo de continuar a prestar um serviço de qualidade e com a simpatia de sempre.
        </p>
      </div>
      <div className="bg-white px-6 py-5 border-t border-[#84CC16]/20">
        <button onClick={onClose} className="w-full bg-[#15803D] hover:bg-[#14532D] text-[#FFFCF2] py-3.5 rounded-xl font-bold transition shadow-sm">
          Fechar
        </button>
      </div>
    </div>
  </div>
));

const Footer = memo(() => (
  <footer className="bg-[#14532D] text-[#FFFCF2] py-10 mt-12 border-t-4 border-[#84CC16]">
    <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
      <div className="flex-1 text-center md:text-left space-y-6">
        <div className="flex items-center justify-center md:justify-start gap-2 text-[#84CC16] mb-2"><Store size={28} /><h3 className="font-heading text-2xl text-[#FFFCF2]">A Nossa Banca</h3></div>
        <div className="flex items-start gap-3 justify-center md:justify-start"><MapPin className="text-[#EA580C] shrink-0 mt-1" size={20} /><div className="text-left"><p className="font-bold text-lg">Mercado Municipal da Costa da Caparica</p><p className="text-sm opacity-90 mt-0.5">Praça da Liberdade, 2825-355 Costa da Caparica</p></div></div>
        <div className="flex items-start gap-3 justify-center md:justify-start"><Clock className="text-[#EA580C] shrink-0 mt-1" size={20} /><div className="text-left"><p className="font-bold text-lg">Horário ao Público</p><p className="text-sm opacity-90 mt-0.5">Terça a Domingo, 07h00 - 14h00</p><p className="text-sm text-[#84CC16] font-semibold mt-0.5">(Encerrado à segunda-feira)</p></div></div>
      </div>
      <div className="w-full md:w-1/2 h-56 rounded-2xl overflow-hidden border-2 border-[#84CC16]/30 shadow-lg">
        <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://maps.google.com/maps?q=Mercado%20Municipal%20da%20Costa%20da%20Caparica,%20Pra%C3%A7a%20da%20Liberdade&t=&z=15&ie=UTF8&iwloc=&output=embed" title="Localização"></iframe>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 mt-8 pt-4 border-t border-[#FFFCF2]/10 text-center text-xs opacity-60">© {new Date().getFullYear()} Frutário - Frutas do Mário. Todos os direitos reservados.</div>
  </footer>
));

const ProductCard = memo(({ product, onAddToCart }) => {
  const n = product.name.toLowerCase();
  const isMelonOrWatermelon = n.includes('melancia') || n.includes('melão') || n.includes('meloa');
  const isPineapple = n.includes('abacaxi');
  
  const getStepAndMin = useCallback((type) => {
    if (type === 'kg') return 0.25; 
    if (isMelonOrWatermelon) return 0.25; 
    if (isPineapple) return 0.5; 
    return 1;
  }, [isMelonOrWatermelon, isPineapple]);

  const defaultType = product.priceKg ? 'kg' : 'unit';
  const [purchaseType, setPurchaseType] = useState(defaultType); 
  const [quantity, setQuantity] = useState(getStepAndMin(defaultType));

  const handleTypeChange = useCallback((type) => {
    setPurchaseType(type);
    setQuantity(getStepAndMin(type));
  }, [getStepAndMin]);

  const handleAdd = useCallback(() => {
    onAddToCart(product, quantity, purchaseType);
    setQuantity(getStepAndMin(purchaseType));
  }, [product, quantity, purchaseType, onAddToCart, getStepAndMin]);

  const currentPrice = purchaseType === 'kg' ? product.priceKg : product.priceUnit;
  const step = getStepAndMin(purchaseType);

  const handleImageError = useCallback((e) => {
    e.target.onerror = null; 
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23FFFCF2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' font-family='sans-serif' fill='%2384CC16'%3E🍎 Produto%3C/text%3E%3C/svg%3E"; 
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#84CC16]/20 overflow-hidden hover:shadow-md transition">
      <div className="h-48 overflow-hidden bg-[#FFFCF2] relative">
        <img src={product.img} alt={product.name} onError={handleImageError} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg font-bold text-[#15803D] shadow-sm text-sm">
          {product.priceKg && `1Kg = ${product.priceKg.toFixed(2)}€`}
          {!product.priceKg && `1 ${product.unitName} = ${product.priceUnit.toFixed(2)}€`}
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold text-[#451A03] mb-3">{product.name}</h3>
        <div className="flex bg-[#FFFCF2] p-1.5 rounded-xl mb-4 border border-[#84CC16]/10">
          {product.priceKg && (
            <button className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition ${purchaseType === 'kg' ? 'bg-white shadow-sm text-[#15803D]' : 'text-[#451A03]/60 hover:text-[#451A03]'}`} onClick={() => handleTypeChange('kg')}>Por Kg</button>
          )}
          {product.priceUnit && (
            <button className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition ${purchaseType === 'unit' ? 'bg-white shadow-sm text-[#15803D]' : 'text-[#451A03]/60 hover:text-[#451A03]'}`} onClick={() => handleTypeChange('unit')}>Por {product.unitName}</button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(step, quantity - step))} className="w-8 h-8 rounded-full bg-[#FFFCF2] border border-[#84CC16]/20 flex items-center justify-center text-[#15803D] hover:bg-[#84CC16]/20 transition"><Minus size={16} /></button>
            <span className="w-12 text-center font-bold text-[#451A03]">{formatQuantity(quantity, purchaseType)} {purchaseType === 'kg' ? 'kg' : ''}</span>
            <button onClick={() => setQuantity(quantity + step)} className="w-8 h-8 rounded-full bg-[#FFFCF2] border border-[#84CC16]/20 flex items-center justify-center text-[#15803D] hover:bg-[#84CC16]/20 transition"><Plus size={16} /></button>
          </div>
        </div>

        <button onClick={handleAdd} className="w-full bg-[#15803D] hover:bg-[#14532D] text-[#FFFCF2] py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-sm">
          <ShoppingBag size={18} /> Adicionar <span className="opacity-80 font-normal">({(currentPrice * quantity).toFixed(2)}€)</span>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// BLOCO 3: VISTAS PRINCIPAIS (VIEWS)
// ============================================================================

const ShopView = memo(({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  const filteredProducts = useMemo(() => products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [products, searchTerm, selectedCategory]);

  const categories = useMemo(() => ['Todas', ...new Set(products.map(p => p.category))], [products]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#14532D]">A Nossa Bancada</h1>
        <p className="text-[#451A03]/70 mb-5">Diretamente da horta para a sua casa. Natural e orgânico!</p>
        <div className="relative mb-2">
          <Search className="absolute left-4 top-3.5 text-[#15803D]/50" size={20} />
          <input type="text" placeholder="Pesquisar por maçã, uva, kiwi..." className="w-full pl-12 pr-4 py-3 bg-white border border-[#84CC16]/30 rounded-xl shadow-sm focus:ring-2 focus:ring-[#84CC16] outline-none transition text-[#451A03]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="sticky top-[81px] md:top-[97px] z-40 bg-[#FFFCF2] pt-2 pb-3 mb-6 -mx-4 px-4 border-b border-[#84CC16]/10">
        <div className="flex overflow-x-auto flex-nowrap gap-2 pb-2 snap-x custom-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 snap-start px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition shadow-sm border ${selectedCategory === cat ? 'bg-[#15803D] text-[#FFFCF2] border-[#15803D]' : 'bg-white text-[#14532D] border-[#84CC16]/30 hover:bg-[#FFFCF2]'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-[#451A03]/60 bg-white rounded-2xl border border-[#84CC16]/20 shadow-sm"><span className="text-4xl mb-3 block opacity-80">🔍</span>Nenhum produto encontrado.</div>
      ) : (
        <div>
          {selectedCategory === 'Todas' ? (
            categories.filter(c => c !== 'Todas').map(category => {
              const prods = filteredProducts.filter(p => p.category === category);
              if (prods.length === 0) return null;
              return (
                <div key={category} className="mb-10 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4 border-b border-[#84CC16]/20 pb-2"><h2 className="text-xl md:text-2xl font-bold text-[#14532D]">{category}</h2><span className="text-sm font-medium bg-[#84CC16]/10 text-[#15803D] px-2.5 py-0.5 rounded-full">{prods.length}</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{prods.map(product => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}</div>
                </div>
              );
            })
          ) : (
            <div className="animate-fade-in mb-10">
              <div className="flex items-center gap-3 mb-4 border-b border-[#84CC16]/20 pb-2"><h2 className="text-xl md:text-2xl font-bold text-[#14532D]">{selectedCategory}</h2><span className="text-sm font-medium bg-[#84CC16]/10 text-[#15803D] px-2.5 py-0.5 rounded-full">{filteredProducts.length}</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{filteredProducts.map(product => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const CartView = memo(({ cart, total, setView, onRemove }) => {
  const [recipe, setRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const generateRecipe = useCallback(async () => {
    setLoadingRecipe(true);
    const fruitNames = cart.map(item => item.product.name).join(', ');
    try {
      const result = await callGemini(`O cliente tem no carrinho: ${fruitNames}. Sugere UMA receita deliciosa, rápida e saudável. Mantém a resposta muito curta. Termina sempre com 'Bom apetite!'.`);
      setRecipe(result);
    } catch(e) { setRecipe("Desculpe, a cozinha virtual está ocupada. Tente mais tarde!"); }
    setLoadingRecipe(false);
  }, [cart]);

  if (cart.length === 0) return (
    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-[#84CC16]/20">
      <div className="bg-[#84CC16]/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"><ShoppingCart size={32} className="text-[#15803D]" /></div>
      <h2 className="text-2xl font-bold text-[#14532D] mb-2">O seu cesto está vazio</h2>
      <p className="text-[#451A03]/60 mb-8">Adicione algumas frutas deliciosas para começar!</p>
      <button onClick={() => setView('shop')} className="bg-[#15803D] hover:bg-[#14532D] text-[#FFFCF2] px-8 py-3 rounded-xl font-medium transition">Voltar à Loja</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-[#14532D] mb-6">O seu Cesto</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-[#84CC16]/20 overflow-hidden mb-6">
        <ul className="divide-y divide-[#84CC16]/10">
          {cart.map((item, index) => {
            const price = item.type === 'kg' ? item.product.priceKg : item.product.priceUnit;
            return (
              <li key={index} className="p-4 sm:p-5 flex items-center gap-4">
                <img src={item.product.img} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover bg-[#FFFCF2]" />
                <div className="flex-1"><h4 className="font-semibold text-[#451A03]">{item.product.name}</h4><p className="text-sm text-[#15803D]">{formatQuantity(item.quantity, item.type)} {item.type === 'kg' ? 'kg' : item.product.unitName} x {price.toFixed(2)}€</p></div>
                <div className="text-right"><p className="font-bold text-[#451A03]">{(price * item.quantity).toFixed(2)}€</p><button onClick={() => onRemove(index)} className="text-[#EA580C]/80 text-sm flex items-center gap-1 mt-1 hover:text-[#EA580C] ml-auto transition"><Trash2 size={14} /> Remover</button></div>
              </li>
            );
          })}
        </ul>
        <div className="bg-[#FFFCF2] p-5 border-t border-[#84CC16]/20 flex flex-col gap-1">
          <div className="flex justify-between items-center"><span className="font-semibold text-[#451A03]/70">Total Estimado*</span><span className="text-2xl font-bold text-[#15803D]">{total.toFixed(2)}€</span></div>
          <span className="text-xs text-[#451A03]/50 text-right mt-1">* Valor sujeito a acerto de pesagem</span>
        </div>
      </div>
      
      <div className="bg-white border border-[#EA580C]/20 p-5 rounded-2xl mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4"><div className="bg-[#EA580C]/10 p-2.5 rounded-full text-[#EA580C]"><ChefHat size={24} /></div><div><h3 className="font-bold text-[#EA580C]">O Chef Mário sugere...</h3><p className="text-sm text-[#451A03]/70">Sem ideias para o que fazer com estas frutas?</p></div></div>
        {recipe ? <div className="bg-[#FFFCF2] p-4 rounded-xl text-[#451A03] text-sm whitespace-pre-line border border-[#EA580C]/10">{recipe}</div> : <button onClick={generateRecipe} disabled={loadingRecipe} className="w-full bg-[#EA580C] hover:bg-[#c2410c] disabled:bg-[#EA580C]/50 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-sm"><Sparkles size={18} />{loadingRecipe ? 'A preparar a sugestão...' : '✨ Descobrir Receita Mágica'}</button>}
      </div>
      
      <div className="bg-[#FFF7ED] border-2 border-[#EA580C]/80 p-5 rounded-2xl mb-6 flex items-start gap-4 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#EA580C]"></div>
        <div className="bg-white p-2.5 rounded-full shadow-sm border border-[#EA580C]/20 text-2xl leading-none flex-shrink-0">⚖️</div>
        <div className="flex-1">
          <h4 className="font-extrabold text-[#9A3412] text-lg mb-1.5 tracking-tight">Atenção aos Pesos e Valores!</h4>
          <p className="text-[#451A03]/90 font-medium leading-relaxed text-sm sm:text-base">
            O valor total do cesto é uma <strong className="text-[#EA580C] uppercase bg-[#EA580C]/10 px-1.5 py-0.5 rounded">estimativa indicativa</strong>.<br className="hidden sm:block mt-1"/>
            Tratando-se de produtos frescos e calibres naturais, o valor final poderá sofrer <strong>ligeiros acertos (+/-)</strong> em função do peso exato apurado na preparação da encomenda.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setView('shop')} className="flex-1 bg-white border border-[#84CC16]/40 text-[#14532D] py-3 rounded-xl font-semibold hover:bg-[#FFFCF2] transition shadow-sm">Continuar a Comprar</button>
        <button onClick={() => setView('checkout')} className="flex-1 bg-[#15803D] hover:bg-[#14532D] text-[#FFFCF2] py-3 rounded-xl font-semibold transition shadow-sm">Avançar para Pedido</button>
      </div>
    </div>
  );
});

const CheckoutView = memo(({ onPlaceOrder, onCancel, total, onOpenPrivacy }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', notes: '', deliveryMethod: 'takeaway', parish: '', address: '', timeSlot: '08:00 - 09:00' });
  const canDeliver = total >= 10;

  useEffect(() => {
    if (!canDeliver && formData.deliveryMethod === 'delivery') setFormData(prev => ({ ...prev, deliveryMethod: 'takeaway', timeSlot: '08:00 - 09:00' }));
  }, [total, canDeliver, formData.deliveryMethod]);

  const deliveryFee = formData.deliveryMethod === 'delivery' ? 2.00 : 0;
  const finalTotal = total + deliveryFee;
  const timeOptions = formData.deliveryMethod === 'takeaway' ? ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00'] : ['15:00 - 16:00', '16:00 - 17:00'];

  const handleMethodChange = useCallback((method) => {
    if (method === 'delivery' && !canDeliver) return;
    setFormData(prev => ({ ...prev, deliveryMethod: method, parish: method === 'delivery' ? (prev.parish || 'Costa da Caparica') : prev.parish, timeSlot: method === 'takeaway' ? '08:00 - 09:00' : '15:00 - 16:00' }));
  }, [canDeliver]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onCancel} className="text-[#451A03]/50 hover:text-[#451A03]">Voltar</button><h1 className="text-2xl md:text-3xl font-bold text-[#14532D]">Detalhes do Pedido</h1></div>
      <form onSubmit={(e) => { e.preventDefault(); onPlaceOrder({ ...formData, finalTotal, deliveryFee }); }} className="bg-white rounded-2xl shadow-sm border border-[#84CC16]/20 p-6">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#451A03] mb-3">Método de Receção</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button type="button" onClick={() => handleMethodChange('takeaway')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${formData.deliveryMethod === 'takeaway' ? 'border-[#15803D] bg-[#15803D]/5 text-[#15803D]' : 'border-[#FFFCF2] bg-[#FFFCF2] text-[#451A03]/60 hover:border-[#84CC16]/50'}`}><Store size={24} className={formData.deliveryMethod === 'takeaway' ? 'text-[#15803D]' : 'text-[#84CC16]'} /><div className="font-bold">Recolha na Loja</div><div className="text-xs">Grátis (08h - 13h)</div></button>
            <button type="button" disabled={!canDeliver} onClick={() => handleMethodChange('delivery')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${formData.deliveryMethod === 'delivery' ? 'border-[#15803D] bg-[#15803D]/5 text-[#15803D]' : 'border-[#FFFCF2] bg-[#FFFCF2] text-[#451A03]/60'} ${!canDeliver ? 'opacity-50 cursor-not-allowed hover:border-[#FFFCF2]' : 'hover:border-[#84CC16]/50'}`}><MapPin size={24} className={formData.deliveryMethod === 'delivery' ? 'text-[#15803D]' : 'text-[#84CC16]'} /><div className="font-bold">Entrega ao Domicílio</div><div className={`text-xs font-semibold ${!canDeliver ? 'text-[#EA580C]' : ''}`}>{canDeliver ? 'Taxa Fixa: +2.00€ (15h - 17h)' : 'Mínimo de 10.00€ no cesto'}</div></button>
          </div>
        </div>
        <div className="mb-6 bg-[#FFFCF2] p-5 rounded-xl border border-[#84CC16]/20">
          <label className="block text-sm font-semibold text-[#451A03] mb-2">Horário de {formData.deliveryMethod === 'takeaway' ? 'Recolha' : 'Entrega'}</label>
          <select required className="w-full px-4 py-3 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none bg-white text-[#451A03] font-medium shadow-sm" value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})}>{timeOptions.map(slot => (<option key={slot} value={slot}>{slot}</option>))}</select>
        </div>
        {formData.deliveryMethod === 'takeaway' && (
          <div className="bg-[#FFFCF2] border border-[#84CC16]/30 p-4 rounded-xl mb-6 text-[#14532D] text-sm flex gap-3 animate-fade-in"><Store className="text-[#84CC16] shrink-0" size={20} /><div><strong>Local de Recolha:</strong><br/>A nossa banca local (Avenida Principal)<br/>(Aguarde confirmação antes de se deslocar)</div></div>
        )}
        {formData.deliveryMethod === 'delivery' && (
          <div className="space-y-4 mb-6 bg-[#FFFCF2] p-5 rounded-xl border border-[#84CC16]/20 animate-fade-in">
            <div><label className="block text-sm font-semibold text-[#451A03] mb-1">Freguesia de Entrega</label><select required className="w-full px-4 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none bg-white text-[#451A03]" value={formData.parish} onChange={e => setFormData({...formData, parish: e.target.value})}><option value="Costa da Caparica">Costa da Caparica</option><option value="Sobreda">Sobreda</option><option value="Charneca da Caparica">Charneca da Caparica</option><option value="Caparica">Caparica</option></select></div>
            <div><label className="block text-sm font-semibold text-[#451A03] mb-1">Morada Completa</label><div className="relative"><MapPin className="absolute left-3 top-3 text-[#84CC16]" size={18} /><textarea required className="w-full pl-10 pr-4 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none text-[#451A03]" placeholder="Rua, Número, Andar..." rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div></div>
          </div>
        )}
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-[#451A03] mb-1">Nome Completo</label><div className="relative"><User className="absolute left-3 top-3 text-[#84CC16]" size={18} /><input required type="text" className="w-full pl-10 pr-4 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none text-[#451A03]" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div></div>
          <div><label className="block text-sm font-semibold text-[#451A03] mb-1">Telemóvel (para contacto)</label><div className="relative"><Phone className="absolute left-3 top-3 text-[#84CC16]" size={18} /><input required type="tel" className="w-full pl-10 pr-4 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none text-[#451A03]" placeholder="Ex: 912 345 678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div></div>
          <div><label className="block text-sm font-semibold text-[#451A03] mb-1">Notas Adicionais</label><textarea className="w-full px-4 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none text-[#451A03]" placeholder="Ex: Tocar à campainha..." rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#84CC16]/20">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 relative flex items-center justify-center">
              <input type="checkbox" required className="w-5 h-5 rounded border-2 border-[#15803D] bg-white text-[#15803D] focus:ring-2 focus:ring-[#15803D] focus:ring-offset-2 cursor-pointer appearance-none checked:bg-[#15803D] checked:border-[#15803D] transition shadow-sm" />
              <CheckCircle2 size={16} className="absolute text-white pointer-events-none opacity-0 group-has-[:checked]:opacity-100" />
            </div>
            <span className="text-sm text-[#451A03]/80 leading-tight">
              Li e aceito a <button type="button" onClick={onOpenPrivacy} className="text-[#15803D] font-bold underline hover:text-[#14532D]">Política de Privacidade e Proteção de Dados (RGPD)</button>. Compreendo que os meus dados serão usados exclusivamente para o processamento e entrega desta encomenda.
            </span>
          </label>
        </div>
        {formData.deliveryMethod === 'delivery' && (
          <div className="mt-6 border-t border-[#84CC16]/20 pt-4 text-sm font-medium text-[#451A03]/80"><div className="flex justify-between mb-1"><span>Subtotal*:</span><span>{total.toFixed(2)}€</span></div><div className="flex justify-between mb-1"><span>Taxa de Entrega:</span><span>{deliveryFee.toFixed(2)}€</span></div><div className="text-xs text-[#451A03]/50 mt-2 italic">* Subtotal meramente indicativo e sujeito a acerto de pesagem.</div></div>
        )}
        <div className="mt-6"><button type="submit" className="w-full bg-[#15803D] hover:bg-[#14532D] text-[#FFFCF2] py-3.5 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2">Confirmar Pedido <span className="opacity-80 font-normal">({finalTotal.toFixed(2)}€)</span></button></div>
      </form>
    </div>
  );
});

const SuccessView = memo(({ setView }) => (
  <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#84CC16]/20 max-w-md mx-auto animate-fade-in px-4">
    <div className="text-[#84CC16] flex justify-center mb-6"><CheckCircle2 size={80} /></div>
    <h2 className="text-3xl font-bold text-[#14532D] mb-3">Tudo pronto!</h2>
    <p className="text-[#451A03]/70 mb-8">O seu pedido está gerado e o WhatsApp deverá abrir.</p>
    <button onClick={() => setView('shop')} className="w-full bg-[#14532D] text-[#FFFCF2] px-8 py-3.5 rounded-xl font-bold hover:bg-[#451A03] transition">Regressar à Montra</button>
  </div>
));

const AdminProductsView = memo(({ products, setProducts }) => {
  const [promoText, setPromoText] = useState({});
  const [loadingPromo, setLoadingPromo] = useState({});

  const toggleAvailability = useCallback((id) => setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p)), [setProducts]);
  const updatePrice = useCallback((id, field, value) => {
    const numValue = value === '' ? null : parseFloat(value);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: numValue } : p));
  }, [setProducts]);

  const generatePromo = useCallback(async (product) => {
    setLoadingPromo(prev => ({...prev, [product.id]: true}));
    const priceText = product.priceKg ? `${product.priceKg}€/Kg` : `${product.priceUnit}€/${product.unitName}`;
    try {
      const result = await callGemini(`Promove de forma muita curta (WhatsApp): ${product.name} a ${priceText}.`);
      setPromoText(prev => ({...prev, [product.id]: result}));
    } catch(e) { setPromoText(prev => ({...prev, [product.id]: "Erro!"})); }
    setLoadingPromo(prev => ({...prev, [product.id]: false}));
  }, []);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#84CC16]/30 p-5 rounded-xl text-[#14532D] text-sm mb-5 shadow-sm">💡 <strong>Gestão de Inventário:</strong> Atualize os preços em tempo real consoante o mercado.</div>
      {categories.map(category => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-bold text-[#15803D] mb-3 border-b border-[#84CC16]/30 pb-1">{category}</h3>
          <div className="grid grid-cols-1 gap-4">
            {products.filter(p => p.category === category).map(product => (
              <div key={product.id} className={`bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center transition ${!product.available ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-[#84CC16]/30'}`}>
                <img src={product.img} alt={product.name} className={`w-16 h-16 rounded-xl object-cover border border-[#FFFCF2] ${!product.available ? 'grayscale' : ''}`} />
                <div className="flex-1 text-center md:text-left w-full"><h3 className="font-bold text-[#14532D] text-lg">{product.name}</h3></div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <div className="w-24"><label className="text-xs font-semibold text-[#451A03]/70 block mb-1">Preço/Kg (€)</label><input type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none text-sm text-[#451A03] font-medium" value={product.priceKg !== null ? product.priceKg : ''} onChange={(e) => updatePrice(product.id, 'priceKg', e.target.value)} placeholder="-" /></div>
                  <div className="w-24"><label className="text-xs font-semibold text-[#451A03]/70 block mb-1">Preço/{product.unitName}</label><input type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-[#84CC16]/30 rounded-lg focus:ring-2 focus:ring-[#15803D] outline-none text-sm text-[#451A03] font-medium" value={product.priceUnit !== null ? product.priceUnit : ''} onChange={(e) => updatePrice(product.id, 'priceUnit', e.target.value)} placeholder="-" /></div>
                  <button onClick={() => toggleAvailability(product.id)} className={`p-2.5 rounded-lg mt-5 transition ${product.available ? 'bg-white border border-[#EA580C]/20 text-[#EA580C] hover:bg-[#EA580C]/10' : 'bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/20'}`}>{product.available ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                <div className="w-full mt-4 md:mt-0 md:ml-4 md:w-60 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#84CC16]/20 pt-4 md:pt-0 md:pl-4">
                  {promoText[product.id] ? <div className="relative group"><p className="text-xs font-medium text-[#451A03] bg-[#FFFCF2] p-3 rounded-lg border border-[#84CC16]/30 pr-8">{promoText[product.id]}</p></div> : <button onClick={() => generatePromo(product)} disabled={loadingPromo[product.id]} className="w-full bg-white hover:bg-[#84CC16]/10 text-[#15803D] border border-[#84CC16]/40 py-2.5 rounded-xl text-xs font-bold transition"><Sparkles size={14} className="inline mr-1" />{loadingPromo[product.id] ? 'A redigir...' : 'Criar Promoção IA'}</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

const AdminView = memo(({ orders, clearNotifications, products, setProducts, onArchiveOrder }) => {
  const [tab, setTab] = useState('orders');
  useEffect(() => { if (tab === 'orders') clearNotifications(); }, [clearNotifications, tab]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl md:text-3xl font-bold text-[#14532D] flex items-center gap-2"><Store className="text-[#84CC16]" />Gestão Interna</h1></div>
      <div className="flex bg-white rounded-xl shadow-sm border border-[#84CC16]/20 p-1 mb-6">
        <button onClick={() => setTab('orders')} className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${tab === 'orders' ? 'bg-[#15803D]/10 text-[#15803D]' : 'text-[#451A03]/50 hover:bg-[#FFFCF2]'}`}><Bell size={18} /> Pedidos ({orders.length})</button>
        <button onClick={() => setTab('products')} className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${tab === 'products' ? 'bg-[#15803D]/10 text-[#15803D]' : 'text-[#451A03]/50 hover:bg-[#FFFCF2]'}`}><Package size={18} /> Inventário</button>
      </div>
      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#84CC16]/20 border-dashed p-12 text-center shadow-sm"><Bell size={48} className="mx-auto text-[#84CC16]/40 mb-4" /><p className="text-[#14532D] font-bold text-lg">Tudo tranquilo.</p></div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-[#84CC16]/30 p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1"><h3 className="text-xl font-bold text-[#14532D]">{order.customer.name}</h3><p className="text-sm font-medium text-[#451A03] mt-1"><Phone size={14} className="inline text-[#84CC16]"/> {order.customer.phone}</p><div className="mt-3 text-sm text-[#451A03] bg-white p-3 rounded-lg border border-[#84CC16]/30"><p className="font-bold text-[#15803D] mb-1">Horário: {order.customer.timeSlot}</p></div></div>
                <div className="flex-1 bg-[#FFFCF2] p-5 rounded-xl border border-[#84CC16]/10"><h4 className="font-bold text-[#14532D] mb-3 border-b border-[#84CC16]/20 pb-2">Total: {order.total.toFixed(2)}€</h4></div>
                <div className="flex md:flex-col gap-3 justify-center"><button onClick={() => onArchiveOrder(order.id)} className="px-4 py-2 bg-white border border-[#84CC16]/40 rounded-xl font-bold hover:bg-[#FFFCF2]">Arquivar</button></div>
              </div>
            ))}
          </div>
        )
      )}
      {tab === 'products' && <AdminProductsView products={products} setProducts={setProducts} />}
    </div>
  );
});

// ============================================================================
// BLOCO 4: APLICAÇÃO PRINCIPAL (ESTADO E ROTEAMENTO)
// ============================================================================

export default function App() {
  const [view, setView] = useState('shop');
  const [products, setProducts] = useState(INITIAL_PRODUCTS.map(p => ({ ...p, available: true })));
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState(0);
  const [user, setUser] = useState(null);
  const [loginMessage, setLoginMessage] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !ALLOWED_ADMINS.includes(currentUser.email)) {
        signOut(auth);
        setUser(null);
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = useMemo(() => user && ALLOWED_ADMINS.includes(user.email), [user]);

  const handleLogin = useCallback(async () => {
    if (!auth) {
      setLoginMessage("⚠️ Erro: Sistema Firebase não configurado. Adicione as chaves no código.");
      setTimeout(() => setLoginMessage(''), 5000);
      return;
    }
    
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;
      
      if (!ALLOWED_ADMINS.includes(loggedInUser.email)) {
        await signOut(auth);
        setLoginMessage("❌ Não tem permissões para fazer login. Contacte a administração.");
        setTimeout(() => setLoginMessage(''), 7000);
      } else {
        setLoginMessage("✅ Bem-vindo ao painel, Mário!");
        setTimeout(() => setLoginMessage(''), 3000);
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setLoginMessage("❌ Ocorreu um erro ao tentar fazer login.");
      setTimeout(() => setLoginMessage(''), 5000);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (!auth) return;
    try { await signOut(auth); } catch (error) {}
    setUser(null); 
    if (view === 'admin') setView('shop');
  }, [view]);

  const addToCart = useCallback((product, quantity, type) => {
    if (quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.type === type);
      if (existing) return prev.map(item => item.product.id === product.id && item.type === type ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { product, quantity, type }];
    });
  }, []);

  const removeFromCart = useCallback((indexToRemove) => {
    setCart(prev => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + ((item.type === 'kg' ? item.product.priceKg : item.product.priceUnit) * item.quantity), 0), [cart]);

  const placeOrder = useCallback((customerData) => {
    const newOrder = { id: `#${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toLocaleString('pt-PT'), customer: customerData, items: cart, total: customerData.finalTotal, status: 'Pendente' };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setAdminNotifications(prev => prev + 1);
    setView('success');

    const itemsText = cart.map(item => `- ${formatQuantity(item.quantity, item.type)} ${item.type === 'kg' ? 'kg' : item.product.unitName} : ${item.product.name}`).join('\n');
    let deliveryInfo = `*Método:* ${customerData.deliveryMethod === 'delivery' ? 'Entrega 🚚' : 'Recolha 🏪'}\n*Horário:* ${customerData.timeSlot}\n`;
    if (customerData.deliveryMethod === 'delivery') deliveryInfo += `*Freguesia:* ${customerData.parish}\n*Morada:* ${customerData.address}\n`;

    const message = `*NOVO PEDIDO* 🛒\n\n*Cliente:* ${customerData.name}\n*Tel:* ${customerData.phone}\n${deliveryInfo}\n*Pedido:*\n${itemsText}\n\n*TOTAL A PAGAR:* ${customerData.finalTotal.toFixed(2)}€`;
    window.open(`https://wa.me/351918811193?text=${encodeURIComponent(message)}`, '_blank');
  }, [cart]);

  const archiveOrder = useCallback((orderId) => setOrders(prev => prev.filter(o => o.id !== orderId)), []);
  const availableProducts = useMemo(() => products.filter(p => p.available), [products]);

  return (
    <div className="min-h-screen pb-20 md:pb-0 relative flex flex-col">
      <BrandStyles />
      {loginMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-[#14532D] text-[#FFFCF2] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm animate-fade-in border border-[#84CC16]">
          <span className="font-bold">{loginMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#FFFCF2] border-b border-[#84CC16]/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('shop')}>
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' className="w-full h-full drop-shadow-sm"><circle cx='35' cy='45' r='25' fill='#EA580C' style={{ mixBlendMode: 'multiply' }}/><path d='M65,20 Q95,40 75,80 Q55,95 35,75 Q15,55 35,25 Z' fill='#84CC16' style={{ mixBlendMode: 'multiply' }}/><circle cx='70' cy='75' r='12' fill='#15803D' style={{ mixBlendMode: 'multiply' }}/></svg>
            </div>
            <div className="flex flex-col"><span className="font-heading text-3xl md:text-4xl text-[#14532D] leading-none">frutário</span><span className="font-signature text-[#EA580C] text-sm md:text-lg leading-none mt-0.5 ml-0.5">frutas do Mário</span></div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setShowAboutModal(true)} className="flex items-center gap-1.5 text-[#15803D] bg-[#84CC16]/10 px-3 py-2 rounded-full font-bold hover:bg-[#84CC16]/20 transition mr-1 md:mr-2">
              <Info size={20} />
              <span className="hidden sm:inline text-sm">Sobre nós</span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-1 md:gap-2">
                <button onClick={() => setView('admin')} className="relative px-3 py-2 bg-[#15803D]/10 border border-[#15803D]/20 text-[#15803D] rounded-full hover:bg-[#15803D]/20 transition flex items-center gap-2" title="Painel de Administração"><Settings size={18} /><span className="hidden md:inline font-medium text-sm">Admin</span>{adminNotifications > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#EA580C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">{adminNotifications}</span>}</button>
                <button onClick={handleLogout} className="p-2 text-[#451A03]/50 hover:text-[#451A03] transition"><LogOut size={20} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1 md:gap-2">
                {user && <button onClick={handleLogout} className="p-2 text-[#EA580C]/70 hover:text-[#EA580C] transition"><LogOut size={20} /></button>}
                <button onClick={handleLogin} className="p-2.5 bg-[#FFFCF2] text-[#14532D] border border-[#84CC16]/50 rounded-full hover:bg-[#84CC16]/10 transition flex items-center"><LogIn size={20} /></button>
              </div>
            )}
            
            <button onClick={() => setView('cart')} className="relative p-2.5 bg-white text-[#14532D] shadow-sm rounded-full hover:bg-[#FFFCF2] transition flex items-center gap-2 border border-[#84CC16]/30">
              <ShoppingCart size={22} /><span className="hidden md:inline font-medium text-lg">{cartTotal.toFixed(2)}€</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#EA580C] text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-sm">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ROTEAMENTO DE VISTAS */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {view === 'shop' && <ShopView products={availableProducts} onAddToCart={addToCart} />}
        {view === 'cart' && <CartView cart={cart} total={cartTotal} setView={setView} onRemove={removeFromCart} />}
        {view === 'checkout' && <CheckoutView onPlaceOrder={placeOrder} onCancel={() => setView('cart')} total={cartTotal} onOpenPrivacy={() => setShowPrivacyModal(true)} />}
        {view === 'success' && <SuccessView setView={setView} />}
        {view === 'admin' && isAdmin && <AdminView orders={orders} clearNotifications={() => setAdminNotifications(0)} products={products} setProducts={setProducts} onArchiveOrder={archiveOrder} />}
        
        {view === 'admin' && !isAdmin && (
          <div className="text-center py-20 animate-fade-in">
            <div className="bg-[#EA580C]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Settings size={32} className="text-[#EA580C]" /></div>
            <h2 className="text-2xl font-bold text-[#14532D] mb-2">Acesso Restrito</h2>
            <button onClick={() => setView('shop')} className="bg-[#15803D] text-[#FFFCF2] px-6 py-3 rounded-xl font-medium mt-6">Voltar à Loja</button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      {view === 'shop' && <Footer />}

      {/* MODAL RGPD */}
      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
      
      {/* MODAL SOBRE NÓS */}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      
      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFCF2] border-t border-[#84CC16]/20 flex justify-around p-3 z-40">
        <button onClick={() => setView('shop')} className={`flex flex-col items-center ${view === 'shop' ? 'text-[#15803D]' : 'text-[#451A03]/50'}`}><Store size={24} /><span className="text-xs mt-1 font-medium">Loja</span></button>
        <button onClick={() => setView('cart')} className={`flex flex-col items-center relative ${view === 'cart' ? 'text-[#15803D]' : 'text-[#451A03]/50'}`}><ShoppingCart size={24} /><span className="text-xs mt-1 font-medium">Carrinho</span>{cart.length > 0 && <span className="absolute top-0 right-2 w-2 h-2 bg-[#EA580C] rounded-full"></span>}</button>
        {isAdmin && <button onClick={() => setView('admin')} className={`flex flex-col items-center relative ${view === 'admin' ? 'text-[#15803D]' : 'text-[#451A03]/50'}`}><Settings size={24} /><span className="text-xs mt-1 font-medium">Admin</span>{adminNotifications > 0 && <span className="absolute top-0 right-1 w-2 h-2 bg-[#EA580C] rounded-full"></span>}</button>}
      </div>
    </div>
  );
}