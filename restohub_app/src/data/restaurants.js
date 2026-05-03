// ─────────────────────────────────────────────────────────────────────────────
// RestoHub — catálogo de restaurantes
// tieneMenu: true  → card clickeable, muestra menú
// tieneMenu: false → card con overlay "Próximamente"
// ─────────────────────────────────────────────────────────────────────────────

export const RESTAURANTS = [
  // Colombia — Medellín
  {
    id: "rh-co-med-001",
    nombre: "La Hacienda Paisa",
    descripcion: "Gastronomía antioqueña de autor.",
    ciudad: "Medellín",
    pais: "CO",
    categoria: "Colombiana",
    activo: true,
    tieneMenu: true,
    calificacion: 4.8,
    reseñas: 312,
    imagen:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&q=90",
  },
  {
    id: "rh-co-med-002",
    nombre: "El Cielo Gourmet",
    descripcion: "Alta cocina colombiana de vanguardia.",
    ciudad: "Medellín",
    pais: "CO",
    categoria: "Fusión",
    activo: true,
    tieneMenu: true,
    calificacion: 4.9,
    reseñas: 189,
    imagen:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=90",
  },
  {
    id: "rh-co-med-003",
    nombre: "Pergamino Café",
    descripcion: "Café de origen y cocina de mercado.",
    ciudad: "Medellín",
    pais: "CO",
    categoria: "Café",
    activo: true,
    tieneMenu: false,
    calificacion: 4.7,
    reseñas: 0,
    imagen:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=700&q=90",
  },
  // Colombia — Bogotá
  {
    id: "rh-co-bog-001",
    nombre: "Andrés Carne de Res",
    descripcion: "El restaurante más icónico de Colombia.",
    ciudad: "Bogotá",
    pais: "CO",
    categoria: "Parrilla",
    activo: true,
    tieneMenu: true,
    calificacion: 4.6,
    reseñas: 2840,
    imagen:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=700&q=90",
  },
  {
    id: "rh-co-bog-002",
    nombre: "Harry Sasson",
    descripcion: "Cocina mediterránea y de fusión.",
    ciudad: "Bogotá",
    pais: "CO",
    categoria: "Internacional",
    activo: true,
    tieneMenu: true,
    calificacion: 4.7,
    reseñas: 560,
    imagen:
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=700&q=90",
  },
  {
    id: "rh-co-bog-003",
    nombre: "Carmen",
    descripcion: "Cocina colombiana contemporánea.",
    ciudad: "Bogotá",
    pais: "CO",
    categoria: "Colombiana",
    activo: false,
    tieneMenu: false,
    calificacion: 4.5,
    reseñas: 0,
    imagen:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=700&q=90",
  },
  // Colombia — Cartagena
  {
    id: "rh-co-cta-001",
    nombre: "Celele",
    descripcion: "Despensa caribeña colombiana de autor.",
    ciudad: "Cartagena",
    pais: "CO",
    categoria: "Mariscos",
    activo: true,
    tieneMenu: true,
    calificacion: 4.9,
    reseñas: 421,
    imagen:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=90",
  },
  {
    id: "rh-co-cta-002",
    nombre: "La Vitrola",
    descripcion: "Sabores del Caribe en jazz y salsa.",
    ciudad: "Cartagena",
    pais: "CO",
    categoria: "Colombiana",
    activo: true,
    tieneMenu: false,
    calificacion: 4.5,
    reseñas: 0,
    imagen:
      "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=700&q=90",
  },
  // México
  {
    id: "rh-mx-cdmx-001",
    nombre: "Quintonil",
    descripcion: "Top 10 Latin America's 50 Best.",
    ciudad: "Ciudad de México",
    pais: "MX",
    categoria: "Internacional",
    activo: true,
    tieneMenu: true,
    calificacion: 4.9,
    reseñas: 734,
    imagen:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=90",
  },
  {
    id: "rh-mx-cdmx-002",
    nombre: "Tacos El Huequito",
    descripcion: "Los tacos al pastor más famosos desde 1959.",
    ciudad: "Ciudad de México",
    pais: "MX",
    categoria: "Mexicana",
    activo: true,
    tieneMenu: false,
    calificacion: 4.7,
    reseñas: 0,
    imagen:
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=700&q=90",
  },
  // Perú
  {
    id: "rh-pe-lim-001",
    nombre: "Central",
    descripcion: "#1 Latinoamérica. Ecosistemas peruanos en cada plato.",
    ciudad: "Lima",
    pais: "PE",
    categoria: "Internacional",
    activo: true,
    tieneMenu: true,
    calificacion: 5.0,
    reseñas: 1203,
    imagen:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=700&q=90",
  },
  {
    id: "rh-pe-lim-002",
    nombre: "Maido",
    descripcion: "Fusión nikkei japonesa-peruana.",
    ciudad: "Lima",
    pais: "PE",
    categoria: "Fusión",
    activo: true,
    tieneMenu: false,
    calificacion: 4.9,
    reseñas: 0,
    imagen:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=700&q=90",
  },
  // Argentina
  {
    id: "rh-ar-bue-001",
    nombre: "Don Julio",
    descripcion: "La mejor parrilla argentina. Carnes premium.",
    ciudad: "Buenos Aires",
    pais: "AR",
    categoria: "Parrilla",
    activo: true,
    tieneMenu: true,
    calificacion: 4.8,
    reseñas: 1890,
    imagen:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=700&q=90",
  },
  // Chile
  {
    id: "rh-cl-scl-001",
    nombre: "Boragó",
    descripcion: "Cocina chilena de vanguardia. Ingredientes endémicos.",
    ciudad: "Santiago",
    pais: "CL",
    categoria: "Internacional",
    activo: true,
    tieneMenu: false,
    calificacion: 4.8,
    reseñas: 0,
    imagen:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=700&q=90",
  },
];

// Países con restaurantes activos en la plataforma
export const ACTIVE_COUNTRIES = [
  {
    code: "CO",
    name: "Colombia",
    flag: "🇨🇴",
    cities: ["Medellín", "Bogotá", "Cartagena", "Cali", "Barranquilla"],
  },
  {
    code: "MX",
    name: "México",
    flag: "🇲🇽",
    cities: ["Ciudad de México", "Guadalajara", "Monterrey"],
  },
  {
    code: "PE",
    name: "Perú",
    flag: "🇵🇪",
    cities: ["Lima", "Arequipa", "Cusco"],
  },
  {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    cities: ["Buenos Aires", "Córdoba", "Mendoza"],
  },
  { code: "CL", name: "Chile", flag: "🇨🇱", cities: ["Santiago", "Valparaíso"] },
];

// Países próximos — solo visuales
export const COMING_COUNTRIES = [
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
];

// Menús disponibles
export const MENUS = {
  "rh-co-med-001": {
    moneda: "COP",
    categorias: [
      {
        nombre: "Entradas",
        platos: [
          {
            id: "m001",
            nombre: "Patacones con Hogao",
            descripcion: "Patacones fritos con salsa criolla hogao artesanal.",
            precio: 12000,
            imagen:
              "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&q=90",
          },
          {
            id: "m002",
            nombre: "Empanadas Vallunas",
            descripcion: "Empanadas de maíz rellenas de papa y carne.",
            precio: 8000,
            imagen:
              "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=90",
          },
        ],
      },
      {
        nombre: "Platos Principales",
        platos: [
          {
            id: "m003",
            nombre: "Bandeja Paisa",
            descripcion:
              "Frijoles, arroz, carne molida, chorizo, morcilla y chicharrón.",
            precio: 35000,
            imagen:
              "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=90",
          },
          {
            id: "m004",
            nombre: "Sancocho de Gallina",
            descripcion:
              "Sopa tradicional con gallina criolla, papa, yuca y maíz.",
            precio: 28000,
            imagen:
              "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&q=90",
          },
          {
            id: "m005",
            nombre: "Ajiaco Bogotano",
            descripcion:
              "Sopa de tres tipos de papa, pollo y guascas con crema.",
            precio: 26000,
            imagen:
              "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&q=90",
          },
        ],
      },
      {
        nombre: "Bebidas",
        platos: [
          {
            id: "m006",
            nombre: "Limonada de Coco",
            descripcion: "Limonada cremosa con coco y azúcar de panela.",
            precio: 9000,
            imagen:
              "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=90",
          },
          {
            id: "m007",
            nombre: "Agua Panela con Limón",
            descripcion: "Bebida tradicional colombiana fría.",
            precio: 6000,
            imagen:
              "https://images.unsplash.com/photo-1595981234058-a9302fb97229?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-co-bog-001": {
    moneda: "COP",
    categorias: [
      {
        nombre: "Parrilla",
        platos: [
          {
            id: "a001",
            nombre: "Churrasco Premium",
            descripcion:
              "500g de lomo fino a las brasas con chimichurri casero.",
            precio: 68000,
            imagen:
              "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=90",
          },
          {
            id: "a002",
            nombre: "Costillas BBQ",
            descripcion: "Costillas de cerdo en salsa BBQ ahumada por 8 horas.",
            precio: 55000,
            imagen:
              "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=90",
          },
        ],
      },
      {
        nombre: "Entradas",
        platos: [
          {
            id: "a003",
            nombre: "Chorizo Artesanal",
            descripcion: "Tres chorizos antioqueños a la brasa con ají.",
            precio: 22000,
            imagen:
              "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-co-med-002": {
    moneda: "COP",
    categorias: [
      {
        nombre: "Degustación",
        platos: [
          {
            id: "c001",
            nombre: "Menú 7 Tiempos",
            descripcion:
              "Experiencia gastronómica completa. Maridaje incluido.",
            precio: 320000,
            imagen:
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=90",
          },
          {
            id: "c002",
            nombre: "Menú 4 Tiempos",
            descripcion: "Versión ejecutiva del menú de autor.",
            precio: 180000,
            imagen:
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-co-bog-002": {
    moneda: "COP",
    categorias: [
      {
        nombre: "Especialidades",
        platos: [
          {
            id: "h001",
            nombre: "Salmón Mediterráneo",
            descripcion:
              "Salmón noruego con costra de hierbas y risotto de azafrán.",
            precio: 89000,
            imagen:
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=90",
          },
          {
            id: "h002",
            nombre: "Lomo al Vino Tinto",
            descripcion:
              "Lomo fino con reducción de Malbec y papas gratinadas.",
            precio: 95000,
            imagen:
              "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-co-cta-001": {
    moneda: "COP",
    categorias: [
      {
        nombre: "Del Mar",
        platos: [
          {
            id: "e001",
            nombre: "Ceviche Celele",
            descripcion: "Pargo con leche de tigre de coco y ají dulce.",
            precio: 48000,
            imagen:
              "https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=500&q=90",
          },
          {
            id: "e002",
            nombre: "Cazuela de Mariscos",
            descripcion:
              "Cazuela criolla con camarón, calamar y mejillones del Caribe.",
            precio: 62000,
            imagen:
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-mx-cdmx-001": {
    moneda: "MXN",
    categorias: [
      {
        nombre: "Degustación",
        platos: [
          {
            id: "q001",
            nombre: "Menú Jardín Interior",
            descripcion:
              "12 tiempos con ingredientes del jardín. Experiencia única.",
            precio: 2800,
            imagen:
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-pe-lim-001": {
    moneda: "PEN",
    categorias: [
      {
        nombre: "Ecosistemas",
        platos: [
          {
            id: "p001",
            nombre: "Mar Profundo",
            descripcion: "Ceviches y tiraditos de profundidades del Pacífico.",
            precio: 280,
            imagen:
              "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=90",
          },
          {
            id: "p002",
            nombre: "Alturas Extremas",
            descripcion: "Proteínas y tubérculos de los Andes a 4000m.",
            precio: 320,
            imagen:
              "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&q=90",
          },
        ],
      },
    ],
  },
  "rh-ar-bue-001": {
    moneda: "ARS",
    categorias: [
      {
        nombre: "Parrilla",
        platos: [
          {
            id: "d001",
            nombre: "Ojo de Bife 400g",
            descripcion: "Corte premium con ensalada y papas al horno.",
            precio: 18500,
            imagen:
              "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=90",
          },
          {
            id: "d002",
            nombre: "Asado de Tira",
            descripcion:
              "Costillas cortas asadas a fuego lento. Para compartir.",
            precio: 14200,
            imagen:
              "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=90",
          },
        ],
      },
    ],
  },
};
