// Dados de produtos agrícolas com imagens e preços
// Sistema de 3 Tabelas: Admin (referência), Consumidor, Produtor

export interface ProductData {
  id: string;
  name: string;
  price: number; // Preço base da tabela Admin
  unit: string;
  trend: 'up' | 'down';
  image: string;
  category: string;
}

// Coordenadas de Fortaleza (referência padrão)
export const FORTALEZA_COORDS = {
  lat: -3.845222,
  lng: -38.586443,
};

// CONSTANTES v6.0 - Sistema de 3 Tabelas
export const PRICE_CONSTANTS = {
  // Tabela Consumidor: Produto/0.8 (consumidor paga mais)
  CONSUMER_DIVISOR: 0.8,
  // Tabela Produtor: Produto*0.7 (produtor recebe menos)
  PRODUCER_MULTIPLIER: 0.7,
  // Frete Motorista: R$1 por km (distância produtor-consumidor)
  FREIGHT_PER_KM: 1.0,
  // Quantidade padrão para exibição
  DEFAULT_DISPLAY_QTY: 10,
};

// Lista de produtos em ordem alfabética (Tabela Admin - Referência)
export const productsDatabase: ProductData[] = ([
  {
    id: '1',
    name: 'Abacate',
    price: 8.50,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '2',
    name: 'Abacaxi',
    price: 5.00,
    unit: 'Un',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '3',
    name: 'Abóbora',
    price: 3.20,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '4',
    name: 'Acelga',
    price: 4.50,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '5',
    name: 'Alface',
    price: 3.00,
    unit: 'Un',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '6',
    name: 'Alho',
    price: 20.35,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2f85?w=100&h=100&fit=crop',
    category: 'temperos',
  },
  {
    id: '7',
    name: 'Banana',
    price: 3.20,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '8',
    name: 'Batata',
    price: 3.80,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber8a?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '9',
    name: 'Batata Doce',
    price: 4.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1596097635121-14b63a7b0c19?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '10',
    name: 'Berinjela',
    price: 5.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1528505086635-4c69d5f10908?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '11',
    name: 'Beterraba',
    price: 4.20,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '12',
    name: 'Brócolis',
    price: 7.50,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '13',
    name: 'Cebola',
    price: 5.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=100&h=100&fit=crop',
    category: 'temperos',
  },
  {
    id: '14',
    name: 'Cenoura',
    price: 4.00,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '15',
    name: 'Chuchu',
    price: 2.80,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '16',
    name: 'Coentro',
    price: 5.00,
    unit: 'Maço',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=100&h=100&fit=crop',
    category: 'temperos',
  },
  {
    id: '17',
    name: 'Couve',
    price: 3.50,
    unit: 'Maço',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1515686811547-3b4b5e0b1a3c?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '18',
    name: 'Couve-flor',
    price: 6.00,
    unit: 'Un',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '19',
    name: 'Espinafre',
    price: 8.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '20',
    name: 'Goiaba',
    price: 6.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '21',
    name: 'Inhame',
    price: 5.50,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '22',
    name: 'Jiló',
    price: 4.80,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '23',
    name: 'Laranja',
    price: 3.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '24',
    name: 'Limão',
    price: 4.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '25',
    name: 'Macaxeira',
    price: 4.20,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1598030343246-eec71cb44231?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '26',
    name: 'Mamão',
    price: 4.50,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '27',
    name: 'Manga',
    price: 5.00,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '28',
    name: 'Maracujá',
    price: 8.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1604495772376-9657f0035eb5?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '29',
    name: 'Maxixe',
    price: 6.00,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '30',
    name: 'Melancia',
    price: 2.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '31',
    name: 'Melão',
    price: 4.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '32',
    name: 'Milho Verde',
    price: 1.50,
    unit: 'Un',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '33',
    name: 'Pepino',
    price: 3.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '34',
    name: 'Pimentão',
    price: 7.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '35',
    name: 'Pitaya',
    price: 25.00,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=100&h=100&fit=crop',
    category: 'frutas',
  },
  {
    id: '36',
    name: 'Quiabo',
    price: 8.50,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '37',
    name: 'Repolho',
    price: 3.00,
    unit: 'Un',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '38',
    name: 'Rúcula',
    price: 4.00,
    unit: 'Maço',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop',
    category: 'verduras',
  },
  {
    id: '39',
    name: 'Salsa',
    price: 3.00,
    unit: 'Maço',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=100&h=100&fit=crop',
    category: 'temperos',
  },
  {
    id: '40',
    name: 'Tomate',
    price: 4.20,
    unit: 'Kg',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1546470427-227c7369a9b8?w=100&h=100&fit=crop',
    category: 'legumes',
  },
  {
    id: '41',
    name: 'Vagem',
    price: 6.50,
    unit: 'Kg',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=100&h=100&fit=crop',
    category: 'legumes',
  },
] as ProductData[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

// Função para calcular distância entre dois pontos (Haversine)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Interface para oferta de produtor
export interface ProducerOffer {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  city: string;
  producerLat: number;
  producerLng: number;
  basePrice: number;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'completed';
  producerCpf?: string;
}

// Interface para demanda de consumidor
export interface ConsumerDemand {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  city: string;
  consumerLat: number;
  consumerLng: number;
  createdAt: Date;
  status: 'pending' | 'paid' | 'accepted' | 'in_transit' | 'completed';
  paymentConfirmed: boolean;
  producerAccepted: boolean;
  consumerCpf?: string;
}

// ========================================
// SISTEMA DE 3 TABELAS v6.0
// ========================================

/**
 * Tabela Admin (Referência)
 * Preço base dos produtos
 */
export function getAdminPrice(productId: string): number {
  const product = productsDatabase.find(p => p.id === productId);
  return product?.price || 0;
}

/**
 * Tabela Consumidor (Mercado)
 * Fórmula: Produto / 0.8 (consumidor paga 25% a mais)
 * Exibe: "Você paga: R$X/Kg, na compra de 10Kg"
 */
export function getConsumerTablePrice(adminPrice: number): number {
  return adminPrice / PRICE_CONSTANTS.CONSUMER_DIVISOR;
}

/**
 * Tabela Produtor (Mercado)
 * Fórmula: Produto * 0.7 (produtor recebe 70%)
 */
export function getProducerTablePrice(adminPrice: number): number {
  return adminPrice * PRICE_CONSTANTS.PRODUCER_MULTIPLIER;
}

/**
 * Calcula frete do motorista
 * Fórmula: R$1 * (Distância entre Produtor e Consumidor)
 */
export function calculateDriverFreight(distanceKm: number): number {
  return PRICE_CONSTANTS.FREIGHT_PER_KM * distanceKm;
}

/**
 * Calcula valor total pago pelo consumidor
 * Fórmula: (Quantidade * Preço Tabela Consumidor) + Frete Motorista
 */
export function calculateConsumerTotal(
  adminPrice: number,
  quantity: number,
  distanceKm: number
): { pricePerUnit: number; subtotal: number; freight: number; total: number } {
  const pricePerUnit = getConsumerTablePrice(adminPrice);
  const subtotal = pricePerUnit * quantity;
  const freight = calculateDriverFreight(distanceKm);
  const total = subtotal + freight;
  
  return { pricePerUnit, subtotal, freight, total };
}

/**
 * Calcula valor que o produtor vai receber
 * Fórmula: Quantidade * Preço Tabela Produtor
 */
export function calculateProducerTotal(
  adminPrice: number,
  quantity: number
): { pricePerUnit: number; total: number } {
  const pricePerUnit = getProducerTablePrice(adminPrice);
  const total = pricePerUnit * quantity;
  
  return { pricePerUnit, total };
}

/**
 * Formata exibição para consumidor
 * "Você paga: R$X/Kg, na compra de 10Kg"
 */
export function formatConsumerDisplay(
  adminPrice: number,
  unit: string
): { pricePerUnit: string; displayText: string } {
  const pricePerUnit = getConsumerTablePrice(adminPrice);
  const displayQty = PRICE_CONSTANTS.DEFAULT_DISPLAY_QTY;
  const totalFor10 = pricePerUnit * displayQty;
  
  return {
    pricePerUnit: `R$${pricePerUnit.toFixed(2)}/${unit}`,
    displayText: `Você paga: R$${pricePerUnit.toFixed(2)}/${unit}, na compra de ${displayQty}${unit === 'Kg' ? 'Kg' : ' unidades'}`
  };
}

/**
 * Formata exibição para produtor
 * Mostra apenas o valor que ele vai receber (sem taxas)
 */
export function formatProducerDisplay(
  adminPrice: number,
  unit: string
): { pricePerUnit: string; displayText: string } {
  const pricePerUnit = getProducerTablePrice(adminPrice);
  const displayQty = PRICE_CONSTANTS.DEFAULT_DISPLAY_QTY;
  const totalFor10 = pricePerUnit * displayQty;
  
  return {
    pricePerUnit: `R$${pricePerUnit.toFixed(2)}/${unit}`,
    displayText: `Você recebe: R$${totalFor10.toFixed(2)}/${displayQty}${unit === 'Kg' ? 'Kg' : ' unidades'}`
  };
}

// Correção ortográfica usando distância de Levenshtein
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
      }
    }
  }
  return dp[m][n];
}

// Encontra o produto mais próximo baseado no nome digitado
export function findClosestProduct(input: string): ProductData | null {
  const normalizedInput = input.toLowerCase().trim();

  // Busca exata primeiro
  const exactMatch = productsDatabase.find(
    (p) => p.name.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;

  // Busca por início do nome
  const startsWithMatch = productsDatabase.find(
    (p) => p.name.toLowerCase().startsWith(normalizedInput)
  );
  if (startsWithMatch) return startsWithMatch;

  // Busca por similaridade (Levenshtein)
  let closest: ProductData | null = null;
  let minDistance = Infinity;

  for (const product of productsDatabase) {
    const distance = levenshteinDistance(
      normalizedInput,
      product.name.toLowerCase()
    );
    if (distance < minDistance && distance <= 3) {
      minDistance = distance;
      closest = product;
    }
  }

  return closest;
}

// Busca produtos por texto parcial
export function searchProducts(query: string): ProductData[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return productsDatabase;

  return productsDatabase.filter(
    (p) =>
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery)
  );
}

// Encontra a melhor oferta para o consumidor (mais barata)
export function findBestOfferForConsumer(
  productId: string,
  consumerLat: number,
  consumerLng: number,
  offers: ProducerOffer[]
): { offer: ProducerOffer | null; distance: number; finalPrice: number } {
  const productOffers = offers.filter(o => o.productId === productId && o.status === 'pending');
  
  if (productOffers.length === 0) {
    // Usar distância padrão de Fortaleza
    const distanceToFortaleza = calculateDistance(
      consumerLat,
      consumerLng,
      FORTALEZA_COORDS.lat,
      FORTALEZA_COORDS.lng
    );
    const product = productsDatabase.find(p => p.id === productId);
    if (!product) return { offer: null, distance: distanceToFortaleza, finalPrice: 0 };
    
    const { total } = calculateConsumerTotal(product.price, 1, distanceToFortaleza);
    return { offer: null, distance: distanceToFortaleza, finalPrice: total };
  }
  
  // Encontrar oferta mais barata (considerando distância)
  let bestOffer: ProducerOffer | null = null;
  let bestDistance = Infinity;
  let bestPrice = Infinity;
  
  for (const offer of productOffers) {
    const distance = calculateDistance(
      consumerLat,
      consumerLng,
      offer.producerLat,
      offer.producerLng
    );
    
    const { total } = calculateConsumerTotal(offer.basePrice, 1, distance);
    
    if (total < bestPrice) {
      bestPrice = total;
      bestDistance = distance;
      bestOffer = offer;
    }
  }
  
  return { offer: bestOffer, distance: bestDistance, finalPrice: bestPrice };
}
