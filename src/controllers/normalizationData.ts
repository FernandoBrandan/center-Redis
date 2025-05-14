/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
type RawItem = {
  item_id?: number;
  serial_number: string;
  source_api: string;
  name: string;
  price: string;
  stock: number;
  details?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type NormalizedItem = {
  serial_number: string;
  source_api: string;
  name: string;
  price: string;
  stock: number;
  details: Record<string, any>;
};

export const standardizationUnificationData = async (...sources: RawItem[][]): Promise<NormalizedItem[]> => {
  // Aplanar todos los arrays de entrada en uno solo
  const merged = sources.flat()

  return merged.map(item => {
    const { source_api, serial_number, name, price, stock, details = {}, item_id, created_at, updated_at, ...rest } = item
    const knownKeys = ['source_api', 'serial_number', 'name', 'price', 'stock', 'details', 'item_id', 'created_at', 'updated_at']

    const additionalDetails: Record<string, any> = {}
    for (const key in rest) {
      if (!knownKeys.includes(key)) additionalDetails[key] = rest[key]
    }

    return { source_api, serial_number, name, details: { ...details, ...additionalDetails }, price, stock }
  })
}


/**
 * 
    MEJORADO
 * 
 * 
 * type RawItem = {
  codigo: string;
  source_api: string;
  name: string;
  price: string;
  stock: number;
  [key: string]: any;
};

type NormalizedItem = {
  codigo: string;
  source_api: string;
  name: string;
  price: string;
  stock: number;
  details: Record<string, any>;
};

export const standardizationUnificationData = async (...sources: RawItem[][]): Promise<NormalizedItem[]> => {
  const merged = sources.flat();

  return merged.map(item => {
    const {
      source_api,
      codigo,
      name,
      price,
      stock,
      ...rest
    } = item;

    const knownKeys = ['codigo', 'name', 'price', 'stock', 'source_api'];

    const additionalDetails: Record<string, any> = {};
    for (const key in rest) {
      if (!knownKeys.includes(key)) {
        additionalDetails[key] = rest[key];
      }
    }

    return {
      serial_number: codigo,
      source_api,
      name,
      price,
      stock,
      details: additionalDetails
    };
  });
};

*/