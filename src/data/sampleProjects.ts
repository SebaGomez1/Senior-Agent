import { SampleProject } from '../types/pipeline';

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'ts-express-auth',
    name: 'TypeScript Express API (Auth & Users)',
    description: 'Servicio backend en Node.js + Express con arquitectura por capas, autenticación JWT y controladores.',
    language: 'typescript',
    defaultPrompt: 'Agregar protección contra ataques de fuerza bruta (Rate Limiting de máximo 5 intentos por minuto por IP) exclusivamente a la ruta de POST /login en src/routes/auth.ts, sin modificar la lógica existente del resto del servidor.',
    files: [
      {
        path: 'src/index.ts',
        language: 'typescript',
        content: `import express from 'express';
import authRoutes from './routes/auth';
import { userController } from './controllers/userController';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.get('/api/users/profile', userController.getProfile);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Servidor ejecutándose en el puerto \${PORT}\`);
});`,
        originalContent: `import express from 'express';
import authRoutes from './routes/auth';
import { userController } from './controllers/userController';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.get('/api/users/profile', userController.getProfile);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Servidor ejecutándose en el puerto \${PORT}\`);
});`,
      },
      {
        path: 'src/routes/auth.ts',
        language: 'typescript',
        content: `import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Mock in-memory user repository
const users = new Map<string, { id: string; email: string; passwordHash: string }>();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }

  const user = users.get(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token, user: { id: user.id, email: user.email } });
});

router.post('/logout', (req: Request, res: Response) => {
  // Stateless logout placeholder
  res.json({ message: 'Sesión finalizada exitosamente' });
});

export default router;`,
        originalContent: `import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Mock in-memory user repository
const users = new Map<string, { id: string; email: string; passwordHash: string }>();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }

  const user = users.get(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token, user: { id: user.id, email: user.email } });
});

router.post('/logout', (req: Request, res: Response) => {
  // Stateless logout placeholder
  res.json({ message: 'Sesión finalizada exitosamente' });
});

export default router;`,
      },
      {
        path: 'src/controllers/userController.ts',
        language: 'typescript',
        content: `import { Request, Response } from 'express';

export const userController = {
  async getProfile(req: Request, res: Response) {
    // In a real app, user is extracted from req.user (jwt middleware)
    res.json({
      id: 'usr_123',
      name: 'Usuario Verificado',
      role: 'developer',
      createdAt: '2026-01-15T08:00:00Z',
    });
  },
};`,
        originalContent: `import { Request, Response } from 'express';

export const userController = {
  async getProfile(req: Request, res: Response) {
    // In a real app, user is extracted from req.user (jwt middleware)
    res.json({
      id: 'usr_123',
      name: 'Usuario Verificado',
      role: 'developer',
      createdAt: '2026-01-15T08:00:00Z',
    });
  },
};`,
      },
      {
        path: 'package.json',
        language: 'json',
        content: `{
  "name": "enterprise-auth-api",
  "version": "1.0.0",
  "scripts": {
    "start": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  }
}`,
        originalContent: `{
  "name": "enterprise-auth-api",
  "version": "1.0.0",
  "scripts": {
    "start": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  }
}`,
      },
    ],
  },
  {
    id: 'py-fastapi-service',
    name: 'Python FastAPI Microservice (Payment Engine)',
    description: 'Microservicio en Python con FastAPI y Pydantic para procesamiento de transacciones financieras.',
    language: 'python',
    defaultPrompt: 'Agregar validación de suma de comprobación (checksum SHA-256) y verificación de límite de monto máximo ($50,000 USD) al procesar pagos en services/payment.py, sin alterar los modelos existentes ni el endpoint principal.',
    files: [
      {
        path: 'main.py',
        language: 'python',
        content: `from fastapi import FastAPI, HTTPException, Depends
from models.transaction import PaymentRequest, PaymentResponse
from services.payment import process_transaction

app = FastAPI(title="Payment Engine API", version="2.4.0")

@app.post("/payments/charge", response_model=PaymentResponse)
async def charge_card(payload: PaymentRequest):
    try:
        result = await process_transaction(payload)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "operational", "engine": "fastapi"}`,
        originalContent: `from fastapi import FastAPI, HTTPException, Depends
from models.transaction import PaymentRequest, PaymentResponse
from services.payment import process_transaction

app = FastAPI(title="Payment Engine API", version="2.4.0")

@app.post("/payments/charge", response_model=PaymentResponse)
async def charge_card(payload: PaymentRequest):
    try:
        result = await process_transaction(payload)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "operational", "engine": "fastapi"}`,
      },
      {
        path: 'services/payment.py',
        language: 'python',
        content: `import uuid
import datetime
from models.transaction import PaymentRequest, PaymentResponse

async def process_transaction(request: PaymentRequest) -> PaymentResponse:
    # Standard transaction processor
    transaction_id = str(uuid.uuid4())
    processed_at = datetime.datetime.utcnow().isoformat()
    
    # Simulación de cargo exitoso en gateway bancario
    return PaymentResponse(
        transaction_id=transaction_id,
        status="APPROVED",
        amount=request.amount,
        currency=request.currency,
        processed_at=processed_at
    )`,
        originalContent: `import uuid
import datetime
from models.transaction import PaymentRequest, PaymentResponse

async def process_transaction(request: PaymentRequest) -> PaymentResponse:
    # Standard transaction processor
    transaction_id = str(uuid.uuid4())
    processed_at = datetime.datetime.utcnow().isoformat()
    
    # Simulación de cargo exitoso en gateway bancario
    return PaymentResponse(
        transaction_id=transaction_id,
        status="APPROVED",
        amount=request.amount,
        currency=request.currency,
        processed_at=processed_at
    )`,
      },
      {
        path: 'models/transaction.py',
        language: 'python',
        content: `from pydantic import BaseModel, Field

class PaymentRequest(BaseModel):
    card_token: str
    amount: float = Field(gt=0, description="Monto mayor a 0")
    currency: str = "USD"
    customer_id: str

class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    amount: float
    currency: str
    processed_at: str`,
        originalContent: `from pydantic import BaseModel, Field

class PaymentRequest(BaseModel):
    card_token: str
    amount: float = Field(gt=0, description="Monto mayor a 0")
    currency: str = "USD"
    customer_id: str

class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    amount: float
    currency: str
    processed_at: str`,
      },
    ],
  },
  {
    id: 'react-campaign-manager',
    name: 'Lead Campaign Manager (Formulario de Campaña)',
    description: 'Aplicación de marketing con formulario de "Creación de Nueva Campaña" en modal oscuro con selección de objetivos, calibración psicográfica y metas.',
    language: 'typescript',
    defaultPrompt: `1. PRESERVACIÓN ABSOLUTA DEL DISEÑO ORIGINAL: Mantén el 100% de la interfaz visual original (tema oscuro #0e1217, tarjetas con bordes esmeralda #10b981, punto verde de selección activa, calibración de precios $29/$199 USD y slider de usuarios). Prohibido convertir el modal a color blanco o alterar la paleta visual.

2. AGREGAR SELECTORES DE UBICACIÓN GEOGRÁFICA (PAÍSES Y CIUDADES): Inserta de forma quirúrgica dos nuevos campos dentro del formulario ("2. Datos del Producto o Web"): "País de Destino (192 ONU)" y "Ciudad / Región Dependiente", heredando exactamente las mismas clases CSS oscuras (bg-[#11141a] border border-neutral-800 text-white rounded-xl). El selector de países debe incluir el catálogo de los 192 países soberanos de la ONU con actualización reactiva automática de ciudades al seleccionar.`,
    files: [
      {
        path: 'src/components/CampaignModal.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  Users, 
  CreditCard, 
  UserPlus, 
  Heart, 
  MessageSquare, 
  Play, 
  Sparkles, 
  Lock, 
  DollarSign, 
  HelpCircle,
  Check
} from 'lucide-react';

export interface CampaignData {
  campaignType: string;
  productName: string;
  targetUrl: string;
  category: string;
  commercialDescription: string;
  currency: string;
  cheapestPlanPrice: number;
  expensivePlanPrice: number;
  targetUsersCount: number;
  selectedPlanTier: 'starter' | 'growth' | 'enterprise';
  estimatedInvestment: number;
  destinationCountry?: string;
  destinationCity?: string;
}

export const CAMPAIGN_TYPES = [
  {
    id: 'user_registrations',
    title: 'Registros de Usuarios',
    subtitle: 'Captación de cuentas...',
    icon: 'users',
    operationTitle: 'Campaña para Registros de Usuarios',
    operationDesc: 'Activa sindicación SEO en Google, fichas de lanzamiento en directorios globales y escucha activa en foros. Los motores trabajan de forma ininterrumpida hasta alcanzar el número exacto de altas en tu Thank You Page.',
    validationDesc: 'Píxel JS en página de registro exitoso o Webhook POST seguro desde tu backend.'
  },
  {
    id: 'plan_sales',
    title: 'Venta de Planes / ...',
    fullTitle: 'Venta de Planes / Membresías',
    subtitle: 'Conversión directa de...',
    icon: 'credit_card',
    operationTitle: 'Campaña para Venta de Planes / Membresías',
    operationDesc: 'Filtra perfiles con poder adquisitivo acorde a tu plan más barato y más caro. Genera casos de estudio con retorno de inversión (ROI), páginas comparativas vs competidores y secuencias de outreach directo B2B. Los motores no paran hasta que el número de planes vendidos esté confirmado.',
    validationDesc: 'Webhook de pasarela de pago (Mercado Pago, Stripe, PayPal) o Píxel'
  },
  {
    id: 'social_followers',
    title: 'Seguidores en Redes...',
    fullTitle: 'Seguidores en Redes Sociales',
    subtitle: 'Crecimiento de audienci...',
    icon: 'user_plus',
    operationTitle: 'Campaña para Seguidores en Redes Sociales',
    operationDesc: 'Sindicación continua de hilos de alto valor, reflexiones B2B e infografías. El sistema detecta conversaciones afines y atrae usuarios interesados en tu contenido hacia tus perfiles oficiales sin granjas de bots.',
    validationDesc: 'Monitoreo de APIs de métricas públicas de perfil o webhook de confirmación social.'
  },
  {
    id: 'likes_engagement',
    title: 'Likes & Engagement',
    subtitle: 'Interacciones masivas,...',
    icon: 'heart',
    operationTitle: 'Campaña para Likes & Engagement',
    operationDesc: 'Detecta los mejores horarios y temas del nicho, creando ganchos psicológicos que impulsan al público a reaccionar, guardar y compartir tus publicaciones clave.',
    validationDesc: 'Píxel de seguimiento de interacciones o conteo automatizado de engagement.'
  },
  {
    id: 'comments_reviews',
    title: 'Comentarios & ...',
    fullTitle: 'Comentarios & Reseñas',
    subtitle: 'Prueba social, feedback...',
    icon: 'message_square',
    operationTitle: 'Campaña para Comentarios & Reseñas',
    operationDesc: 'Plantea preguntas provocativas del sector, encuestas y dilemas técnicos para que usuarios experimentados comenten sus experiencias y generen prueba social irresistible para nuevos compradores.',
    validationDesc: 'Webhook de envío de comentarios o verificación de reseñas moderadas.'
  },
  {
    id: 'views_subscribers',
    title: 'Vistas & Suscriptores...',
    fullTitle: 'Vistas & Suscriptores en YouTube',
    subtitle: 'Tráfico audiovisual masiv...',
    icon: 'play',
    operationTitle: 'Campaña de Vistas & Suscriptores en YouTube',
    operationDesc: 'Convierte tus videos en micro-clips para Shorts/Reels/TikTok con enlaces al video principal, inserta tus videos en artículos técnicos de alto rango de Google y difunde resúmenes en hilos de X.',
    validationDesc: 'URL del video / canal con verificación de contador y píxel en reproducciones embebidas.'
  }
];

export function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignData) => void;
}) {
  const [selectedType, setSelectedType] = useState('user_registrations');
  const [productName, setProductName] = useState('NovaMetrics Cloud');
  const [targetUrl, setTargetUrl] = useState('https://novametrics.io');
  const [category, setCategory] = useState('Fintech & B2B SaaS');
  const [commercialDescription, setCommercialDescription] = useState('Plataforma de inteligencia de flujos financieros y proyecciones automatizadas para empresas.');
  const [currency, setCurrency] = useState('USD ($)');
  const [cheapestPrice, setCheapestPrice] = useState(29);
  const [expensivePrice, setExpensivePrice] = useState(199);
  const [targetUsers, setTargetUsers] = useState(120000);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'enterprise'>('enterprise');

  if (!isOpen) return null;

  const currentTypeConfig = CAMPAIGN_TYPES.find((t) => t.id === selectedType) || CAMPAIGN_TYPES[0];

  const calculateInvestment = () => {
    if (selectedTier === 'starter') return 490;
    if (selectedTier === 'growth') return 1890;
    const extraUsers = Math.max(0, targetUsers - 100000);
    return 8900 + Math.round((extraUsers / 20000) * 1780);
  };

  const estimatedTotal = calculateInvestment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      campaignType: selectedType,
      productName,
      targetUrl,
      category,
      commercialDescription,
      currency,
      cheapestPlanPrice: cheapestPrice,
      expensivePlanPrice: expensivePrice,
      targetUsersCount: targetUsers,
      selectedPlanTier: selectedTier,
      estimatedInvestment: estimatedTotal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-[#0e1217] border border-neutral-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800/80 flex items-start justify-between relative bg-[#0b0e13]">
          <div className="flex items-start gap-3">
            <div className="text-emerald-400 mt-0.5">
              <Zap className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Creación de Nueva Campaña
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Sin APIs internas. Configuración externa 100% segura con apagado exacto al cumplir la meta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Tipo de Campaña (Grid of 6 Cards) */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {CAMPAIGN_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={\`p-3 rounded-xl border text-left transition-all relative flex flex-col gap-1.5 cursor-pointer \${
                      isSelected
                        ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                        : 'bg-[#12161c] border-neutral-800/80 hover:border-neutral-700'
                    }\`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )}
                    <div className={isSelected ? 'text-emerald-400' : 'text-neutral-400'}>
                      {type.icon === 'users' && <Users className="w-4 h-4" />}
                      {type.icon === 'credit_card' && <CreditCard className="w-4 h-4" />}
                      {type.icon === 'user_plus' && <UserPlus className="w-4 h-4" />}
                      {type.icon === 'heart' && <Heart className="w-4 h-4" />}
                      {type.icon === 'message_square' && <MessageSquare className="w-4 h-4" />}
                      {type.icon === 'play' && <Play className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-[12px] truncate">{type.title}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{type.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation box for selected campaign */}
            <div className="bg-[#10141a] border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Cómo opera: {currentTypeConfig.operationTitle}</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                {currentTypeConfig.operationDesc}
              </p>
              <div className="pt-2 border-t border-neutral-800/60 flex items-start gap-1.5 text-[10px] text-neutral-400">
                <Lock className="w-3.5 h-3.5 text-amber-400/90 shrink-0 mt-0.5" />
                <span><strong className="text-neutral-300">Validación externa:</strong> {currentTypeConfig.validationDesc}</span>
              </div>
            </div>
          </div>

          {/* 2. Datos del Producto o Web */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/60">
            <h3 className="font-semibold text-white text-[13px]">
              2. Datos del Producto o Web
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                Nombre de la Aplicación, Producto o Canal *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: NovaMetrics Cloud, NovaMetrics, TechMaster Studio"
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                URL de Destino / Web / Canal *
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://"
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                Categoría o Nicho *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Fintech & B2B SaaS"
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                Descripción Comercial (Beneficios Clave)
              </label>
              <textarea
                rows={2}
                value={commercialDescription}
                onChange={(e) => setCommercialDescription(e.target.value)}
                placeholder="Qué problema resuelves y por qué un usuario debería registrarse o comprar tu plan..."
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* 3. Calibración de Precios de tu Web */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-[13px]">
                  3. Calibración de Precios de tu Web (Pregunta Estratégica)
                </h3>
              </div>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[#11141a] border border-neutral-800 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="ARS ($)">ARS ($)</option>
                  <option value="MXN ($)">MXN ($)</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              ¿Cuánto valen los planes que ofreces actualmente en tu página?
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-neutral-300 block mb-1">
                  ¿Cuánto vale el plan MÁS BARATO en tu página? *
                </label>
                <div className="flex items-center bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 focus-within:border-emerald-500">
                  <span className="text-neutral-500 mr-2">$</span>
                  <input
                    type="number"
                    value={cheapestPrice}
                    onChange={(e) => setCheapestPrice(Number(e.target.value))}
                    className="w-full bg-transparent text-white focus:outline-none"
                  />
                  <span className="text-neutral-500 text-[10px] ml-2">USD</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 block mb-1">
                  ¿Cuánto vale el plan MÁS CARO en tu página? *
                </label>
                <div className="flex items-center bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 focus-within:border-emerald-500">
                  <span className="text-neutral-500 mr-2">$</span>
                  <input
                    type="number"
                    value={expensivePrice}
                    onChange={(e) => setExpensivePrice(Number(e.target.value))}
                    className="w-full bg-transparent text-white focus:outline-none"
                  />
                  <span className="text-neutral-500 text-[10px] ml-2">USD</span>
                </div>
              </div>
            </div>

            <div className="bg-[#10141a] border border-neutral-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>¿Por qué preguntamos el valor de tus planes?</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                Para calibrar el algoritmo de prospección y segmentación psicográfica. El sistema perfila a usuarios con el poder adquisitivo exacto para pagar entre \${cheapestPrice} y \${expensivePrice} USD, descartando personas sin capacidad de compra y enfocándose en decisores con presupuesto.
              </p>
            </div>
          </div>

          {/* 4. Meta de Usuarios Registrados y Planes */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white">
                Meta de Usuarios Registrados que Deseas Comprar:
              </span>
              <div className="bg-[#11141a] border border-neutral-800 px-3 py-1 rounded-lg font-mono text-emerald-400 font-bold text-[12px]">
                {targetUsers.toLocaleString()} <span className="text-neutral-400 font-normal text-[10px]">usuarios</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={2000}
              max={150000}
              step={1000}
              value={targetUsers}
              onChange={(e) => setTargetUsers(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Plan Tier Cards */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedTier('starter'); setTargetUsers(2000); }}
                className={\`p-2.5 rounded-xl border text-left transition-all cursor-pointer \${
                  selectedTier === 'starter'
                    ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-[#11141a] border-neutral-800 hover:border-neutral-700'
                }\`}
              >
                <div className="font-semibold text-white text-[11px]">Plan Starter</div>
                <div className="text-emerald-400 font-bold text-[12px] mt-0.5">$490 USD</div>
                <div className="text-[10px] text-neutral-400 mt-1">Hasta 2,000 u.</div>
                <div className="text-[9px] text-neutral-500">Módulos 1-3</div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedTier('growth'); setTargetUsers(10000); }}
                className={\`p-2.5 rounded-xl border text-left transition-all cursor-pointer \${
                  selectedTier === 'growth'
                    ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-[#11141a] border-neutral-800 hover:border-neutral-700'
                }\`}
              >
                <div className="font-semibold text-white text-[11px]">Plan Growth</div>
                <div className="text-emerald-400 font-bold text-[12px] mt-0.5">$1,890 USD</div>
                <div className="text-[10px] text-neutral-400 mt-1">Hasta 10,000 u.</div>
                <div className="text-[9px] text-neutral-500">Módulos 1-5</div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedTier('enterprise'); setTargetUsers(120000); }}
                className={\`p-2.5 rounded-xl border text-left transition-all relative cursor-pointer \${
                  selectedTier === 'enterprise'
                    ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-[#11141a] border-neutral-800 hover:border-neutral-700'
                }\`}
              >
                <div className="font-semibold text-white text-[11px]">Plan Enterprise</div>
                <div className="text-emerald-400 font-bold text-[12px] mt-0.5">$8,900 USD</div>
                <div className="text-[10px] text-neutral-400 mt-1">100,000+ u.</div>
                <div className="text-[9px] text-neutral-500">Módulos 1-8</div>
              </button>
            </div>

            {/* Total summary */}
            <div className="bg-[#10141a] border border-neutral-800/80 rounded-xl p-3 flex items-center justify-between">
              <span className="text-[11px] text-neutral-300">
                Inversión estimada para {targetUsers.toLocaleString()} usuarios:
              </span>
              <span className="font-bold text-emerald-400 text-sm font-mono">
                \${estimatedTotal.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#0b0e13] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center gap-2"
          >
            <span>Crear Campaña</span>
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}`,
        originalContent: `import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  Users, 
  CreditCard, 
  UserPlus, 
  Heart, 
  MessageSquare, 
  Play, 
  Sparkles, 
  Lock, 
  DollarSign, 
  HelpCircle,
  Check
} from 'lucide-react';

export interface CampaignData {
  campaignType: string;
  productName: string;
  targetUrl: string;
  category: string;
  commercialDescription: string;
  currency: string;
  cheapestPlanPrice: number;
  expensivePlanPrice: number;
  targetUsersCount: number;
  selectedPlanTier: 'starter' | 'growth' | 'enterprise';
  estimatedInvestment: number;
  destinationCountry?: string;
  destinationCity?: string;
}

export const CAMPAIGN_TYPES = [
  {
    id: 'user_registrations',
    title: 'Registros de Usuarios',
    subtitle: 'Captación de cuentas...',
    icon: 'users',
    operationTitle: 'Campaña para Registros de Usuarios',
    operationDesc: 'Activa sindicación SEO en Google, fichas de lanzamiento en directorios globales y escucha activa en foros. Los motores trabajan de forma ininterrumpida hasta alcanzar el número exacto de altas en tu Thank You Page.',
    validationDesc: 'Píxel JS en página de registro exitoso o Webhook POST seguro desde tu backend.'
  },
  {
    id: 'plan_sales',
    title: 'Venta de Planes / ...',
    fullTitle: 'Venta de Planes / Membresías',
    subtitle: 'Conversión directa de...',
    icon: 'credit_card',
    operationTitle: 'Campaña para Venta de Planes / Membresías',
    operationDesc: 'Filtra perfiles con poder adquisitivo acorde a tu plan más barato y más caro. Genera casos de estudio con retorno de inversión (ROI), páginas comparativas vs competidores y secuencias de outreach directo B2B. Los motores no paran hasta que el número de planes vendidos esté confirmado.',
    validationDesc: 'Webhook de pasarela de pago (Mercado Pago, Stripe, PayPal) o Píxel'
  },
  {
    id: 'social_followers',
    title: 'Seguidores en Redes...',
    fullTitle: 'Seguidores en Redes Sociales',
    subtitle: 'Crecimiento de audienci...',
    icon: 'user_plus',
    operationTitle: 'Campaña para Seguidores en Redes Sociales',
    operationDesc: 'Sindicación continua de hilos de alto valor, reflexiones B2B e infografías. El sistema detecta conversaciones afines y atrae usuarios interesados en tu contenido hacia tus perfiles oficiales sin granjas de bots.',
    validationDesc: 'Monitoreo de APIs de métricas públicas de perfil o webhook de confirmación social.'
  },
  {
    id: 'likes_engagement',
    title: 'Likes & Engagement',
    subtitle: 'Interacciones masivas,...',
    icon: 'heart',
    operationTitle: 'Campaña para Likes & Engagement',
    operationDesc: 'Detecta los mejores horarios y temas del nicho, creando ganchos psicológicos que impulsan al público a reaccionar, guardar y compartir tus publicaciones clave.',
    validationDesc: 'Píxel de seguimiento de interacciones o conteo automatizado de engagement.'
  },
  {
    id: 'comments_reviews',
    title: 'Comentarios & ...',
    fullTitle: 'Comentarios & Reseñas',
    subtitle: 'Prueba social, feedback...',
    icon: 'message_square',
    operationTitle: 'Campaña para Comentarios & Reseñas',
    operationDesc: 'Plantea preguntas provocativas del sector, encuestas y dilemas técnicos para que usuarios experimentados comenten sus experiencias y generen prueba social irresistible para nuevos compradores.',
    validationDesc: 'Webhook de envío de comentarios o verificación de reseñas moderadas.'
  },
  {
    id: 'views_subscribers',
    title: 'Vistas & Suscriptores...',
    fullTitle: 'Vistas & Suscriptores en YouTube',
    subtitle: 'Tráfico audiovisual masiv...',
    icon: 'play',
    operationTitle: 'Campaña de Vistas & Suscriptores en YouTube',
    operationDesc: 'Convierte tus videos en micro-clips para Shorts/Reels/TikTok con enlaces al video principal, inserta tus videos en artículos técnicos de alto rango de Google y difunde resúmenes en hilos de X.',
    validationDesc: 'URL del video / canal con verificación de contador y píxel en reproducciones embebidas.'
  }
];

export function CampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignData) => void;
}) {
  const [selectedType, setSelectedType] = useState('user_registrations');
  const [productName, setProductName] = useState('NovaMetrics Cloud');
  const [targetUrl, setTargetUrl] = useState('https://novametrics.io');
  const [category, setCategory] = useState('Fintech & B2B SaaS');
  const [commercialDescription, setCommercialDescription] = useState('Plataforma de inteligencia de flujos financieros y proyecciones automatizadas para empresas.');
  const [currency, setCurrency] = useState('USD ($)');
  const [cheapestPrice, setCheapestPrice] = useState(29);
  const [expensivePrice, setExpensivePrice] = useState(199);
  const [targetUsers, setTargetUsers] = useState(120000);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'enterprise'>('enterprise');

  if (!isOpen) return null;

  const currentTypeConfig = CAMPAIGN_TYPES.find((t) => t.id === selectedType) || CAMPAIGN_TYPES[0];

  const calculateInvestment = () => {
    if (selectedTier === 'starter') return 490;
    if (selectedTier === 'growth') return 1890;
    const extraUsers = Math.max(0, targetUsers - 100000);
    return 8900 + Math.round((extraUsers / 20000) * 1780);
  };

  const estimatedTotal = calculateInvestment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      campaignType: selectedType,
      productName,
      targetUrl,
      category,
      commercialDescription,
      currency,
      cheapestPlanPrice: cheapestPrice,
      expensivePlanPrice: expensivePrice,
      targetUsersCount: targetUsers,
      selectedPlanTier: selectedTier,
      estimatedInvestment: estimatedTotal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-[#0e1217] border border-neutral-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800/80 flex items-start justify-between relative bg-[#0b0e13]">
          <div className="flex items-start gap-3">
            <div className="text-emerald-400 mt-0.5">
              <Zap className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Creación de Nueva Campaña
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Sin APIs internas. Configuración externa 100% segura con apagado exacto al cumplir la meta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Tipo de Campaña (Grid of 6 Cards) */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {CAMPAIGN_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={\`p-3 rounded-xl border text-left transition-all relative flex flex-col gap-1.5 cursor-pointer \${
                      isSelected
                        ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                        : 'bg-[#12161c] border-neutral-800/80 hover:border-neutral-700'
                    }\`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    )}
                    <div className={isSelected ? 'text-emerald-400' : 'text-neutral-400'}>
                      {type.icon === 'users' && <Users className="w-4 h-4" />}
                      {type.icon === 'credit_card' && <CreditCard className="w-4 h-4" />}
                      {type.icon === 'user_plus' && <UserPlus className="w-4 h-4" />}
                      {type.icon === 'heart' && <Heart className="w-4 h-4" />}
                      {type.icon === 'message_square' && <MessageSquare className="w-4 h-4" />}
                      {type.icon === 'play' && <Play className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-[12px] truncate">{type.title}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{type.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation box for selected campaign */}
            <div className="bg-[#10141a] border border-neutral-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Cómo opera: {currentTypeConfig.operationTitle}</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                {currentTypeConfig.operationDesc}
              </p>
              <div className="pt-2 border-t border-neutral-800/60 flex items-start gap-1.5 text-[10px] text-neutral-400">
                <Lock className="w-3.5 h-3.5 text-amber-400/90 shrink-0 mt-0.5" />
                <span><strong className="text-neutral-300">Validación externa:</strong> {currentTypeConfig.validationDesc}</span>
              </div>
            </div>
          </div>

          {/* 2. Datos del Producto o Web */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/60">
            <h3 className="font-semibold text-white text-[13px]">
              2. Datos del Producto o Web
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                Nombre de la Aplicación, Producto o Canal *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: NovaMetrics Cloud, NovaMetrics, TechMaster Studio"
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                URL de Destino / Web / Canal *
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://"
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                Categoría o Nicho *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Fintech & B2B SaaS"
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-300">
                Descripción Comercial (Beneficios Clave)
              </label>
              <textarea
                rows={2}
                value={commercialDescription}
                onChange={(e) => setCommercialDescription(e.target.value)}
                placeholder="Qué problema resuelves y por qué un usuario debería registrarse o comprar tu plan..."
                className="w-full bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* 3. Calibración de Precios de tu Web */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-[13px]">
                  3. Calibración de Precios de tu Web (Pregunta Estratégica)
                </h3>
              </div>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[#11141a] border border-neutral-800 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="ARS ($)">ARS ($)</option>
                  <option value="MXN ($)">MXN ($)</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              ¿Cuánto valen los planes que ofreces actualmente en tu página?
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-neutral-300 block mb-1">
                  ¿Cuánto vale el plan MÁS BARATO en tu página? *
                </label>
                <div className="flex items-center bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 focus-within:border-emerald-500">
                  <span className="text-neutral-500 mr-2">$</span>
                  <input
                    type="number"
                    value={cheapestPrice}
                    onChange={(e) => setCheapestPrice(Number(e.target.value))}
                    className="w-full bg-transparent text-white focus:outline-none"
                  />
                  <span className="text-neutral-500 text-[10px] ml-2">USD</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 block mb-1">
                  ¿Cuánto vale el plan MÁS CARO en tu página? *
                </label>
                <div className="flex items-center bg-[#11141a] border border-neutral-800 rounded-xl px-3 py-2 focus-within:border-emerald-500">
                  <span className="text-neutral-500 mr-2">$</span>
                  <input
                    type="number"
                    value={expensivePrice}
                    onChange={(e) => setExpensivePrice(Number(e.target.value))}
                    className="w-full bg-transparent text-white focus:outline-none"
                  />
                  <span className="text-neutral-500 text-[10px] ml-2">USD</span>
                </div>
              </div>
            </div>

            <div className="bg-[#10141a] border border-neutral-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>¿Por qué preguntamos el valor de tus planes?</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                Para calibrar el algoritmo de prospección y segmentación psicográfica. El sistema perfila a usuarios con el poder adquisitivo exacto para pagar entre \${cheapestPrice} y \${expensivePrice} USD, descartando personas sin capacidad de compra y enfocándose en decisores con presupuesto.
              </p>
            </div>
          </div>

          {/* 4. Meta de Usuarios Registrados y Planes */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white">
                Meta de Usuarios Registrados que Deseas Comprar:
              </span>
              <div className="bg-[#11141a] border border-neutral-800 px-3 py-1 rounded-lg font-mono text-emerald-400 font-bold text-[12px]">
                {targetUsers.toLocaleString()} <span className="text-neutral-400 font-normal text-[10px]">usuarios</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={2000}
              max={150000}
              step={1000}
              value={targetUsers}
              onChange={(e) => setTargetUsers(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Plan Tier Cards */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedTier('starter'); setTargetUsers(2000); }}
                className={\`p-2.5 rounded-xl border text-left transition-all cursor-pointer \${
                  selectedTier === 'starter'
                    ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-[#11141a] border-neutral-800 hover:border-neutral-700'
                }\`}
              >
                <div className="font-semibold text-white text-[11px]">Plan Starter</div>
                <div className="text-emerald-400 font-bold text-[12px] mt-0.5">$490 USD</div>
                <div className="text-[10px] text-neutral-400 mt-1">Hasta 2,000 u.</div>
                <div className="text-[9px] text-neutral-500">Módulos 1-3</div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedTier('growth'); setTargetUsers(10000); }}
                className={\`p-2.5 rounded-xl border text-left transition-all cursor-pointer \${
                  selectedTier === 'growth'
                    ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-[#11141a] border-neutral-800 hover:border-neutral-700'
                }\`}
              >
                <div className="font-semibold text-white text-[11px]">Plan Growth</div>
                <div className="text-emerald-400 font-bold text-[12px] mt-0.5">$1,890 USD</div>
                <div className="text-[10px] text-neutral-400 mt-1">Hasta 10,000 u.</div>
                <div className="text-[9px] text-neutral-500">Módulos 1-5</div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedTier('enterprise'); setTargetUsers(120000); }}
                className={\`p-2.5 rounded-xl border text-left transition-all relative cursor-pointer \${
                  selectedTier === 'enterprise'
                    ? 'bg-[#12181f] border-emerald-500 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                    : 'bg-[#11141a] border-neutral-800 hover:border-neutral-700'
                }\`}
              >
                <div className="font-semibold text-white text-[11px]">Plan Enterprise</div>
                <div className="text-emerald-400 font-bold text-[12px] mt-0.5">$8,900 USD</div>
                <div className="text-[10px] text-neutral-400 mt-1">100,000+ u.</div>
                <div className="text-[9px] text-neutral-500">Módulos 1-8</div>
              </button>
            </div>

            {/* Total summary */}
            <div className="bg-[#10141a] border border-neutral-800/80 rounded-xl p-3 flex items-center justify-between">
              <span className="text-[11px] text-neutral-300">
                Inversión estimada para {targetUsers.toLocaleString()} usuarios:
              </span>
              <span className="font-bold text-emerald-400 text-sm font-mono">
                \${estimatedTotal.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#0b0e13] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center gap-2"
          >
            <span>Crear Campaña</span>
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}`,
      },
      {
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { CampaignModal, CampaignData } from './components/CampaignModal';
import { Zap, Plus, Globe, ShieldCheck } from 'lucide-react';

export default function App() {
  const [modalOpen, setModalOpen] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([
    {
      campaignType: 'user_registrations',
      productName: 'NovaMetrics Cloud',
      targetUrl: 'https://novametrics.io',
      category: 'Fintech & B2B SaaS',
      commercialDescription: 'Proyecciones automatizadas para empresas.',
      currency: 'USD ($)',
      cheapestPlanPrice: 29,
      expensivePlanPrice: 199,
      targetUsersCount: 120000,
      selectedPlanTier: 'enterprise',
      estimatedInvestment: 10680,
    },
  ]);

  return (
    <div className="min-h-screen bg-[#080b0e] text-slate-100 p-4 sm:p-8 font-sans">
      <header className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5 fill-emerald-400/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono tracking-wider">LeadPulse</span> Campaign Studio
            </h1>
            <p className="text-xs text-neutral-400">Suite de Adquisición y Tráfico de Alta Conversión</p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dar de Alta Nueva Campaña</span>
        </button>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="bg-[#0e1217] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Campañas Activas ({campaigns.length})
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
              Sincronización 100% Externa
            </span>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp, idx) => (
              <div
                key={idx}
                className="bg-[#12161c] border border-neutral-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{camp.productName}</span>
                    <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                      {camp.category}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Meta: <strong className="text-emerald-400">{camp.targetUsersCount.toLocaleString()}</strong> usuarios · Inversión: <strong className="text-white">\${camp.estimatedInvestment.toLocaleString()} {camp.currency}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    En Ejecución
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <CampaignModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          setCampaigns((prev) => [...prev, data]);
          setModalOpen(false);
        }}
      />
    </div>
  );
}`,
        originalContent: `import React, { useState } from 'react';
import { CampaignModal, CampaignData } from './components/CampaignModal';
import { Zap, Plus, Globe, ShieldCheck } from 'lucide-react';

export default function App() {
  const [modalOpen, setModalOpen] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([
    {
      campaignType: 'user_registrations',
      productName: 'NovaMetrics Cloud',
      targetUrl: 'https://novametrics.io',
      category: 'Fintech & B2B SaaS',
      commercialDescription: 'Proyecciones automatizadas para empresas.',
      currency: 'USD ($)',
      cheapestPlanPrice: 29,
      expensivePlanPrice: 199,
      targetUsersCount: 120000,
      selectedPlanTier: 'enterprise',
      estimatedInvestment: 10680,
    },
  ]);

  return (
    <div className="min-h-screen bg-[#080b0e] text-slate-100 p-4 sm:p-8 font-sans">
      <header className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-8 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5 fill-emerald-400/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono tracking-wider">LeadPulse</span> Campaign Studio
            </h1>
            <p className="text-xs text-neutral-400">Suite de Adquisición y Tráfico de Alta Conversión</p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Dar de Alta Nueva Campaña</span>
        </button>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="bg-[#0e1217] border border-neutral-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800/80">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Campañas Activas ({campaigns.length})
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
              Sincronización 100% Externa
            </span>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp, idx) => (
              <div
                key={idx}
                className="bg-[#12161c] border border-neutral-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{camp.productName}</span>
                    <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                      {camp.category}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Meta: <strong className="text-emerald-400">{camp.targetUsersCount.toLocaleString()}</strong> usuarios · Inversión: <strong className="text-white">\${camp.estimatedInvestment.toLocaleString()} {camp.currency}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    En Ejecución
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <CampaignModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          setCampaigns((prev) => [...prev, data]);
          setModalOpen(false);
        }}
      />
    </div>
  );
}`,
      },
    ],
  },
];
