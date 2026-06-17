import { config } from '@/config';

/**
 * Servicio centralizado de API para el frontend
 * Agrupa todas las llamadas fetch en un único lugar para modularización
 */

// ==================== TIPOS ====================
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  isFormData?: boolean;
}

// ==================== UTILIDADES ====================
/**
 * Realiza un fetch genérico con manejo de errores centralizado
 */
async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    headers = {},
    body,
    isFormData = false,
  } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${config.BACKEND_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: isFormData ? headers : (method === 'GET' ? headers : { 'Content-Type': 'application/json', ...headers }),
  };

  if (body) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  console.log("Calling API:", url, method, fetchOptions);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ==================== ARTISTAS ====================
export const ArtistService = {
  /**
   * Obtiene un listado de artistas con búsqueda y paginación
   */
  list: async (search: string = '', page: number = 1) => {
    return apiCall(`/api/artists?search=${encodeURIComponent(search)}&page=${page}`);
  },

  /**
   * Obtiene todos los artistas sin límite (útil para selects)
   */
  listAll: async () => {
    return apiCall('/api/artists?nolimits=true');
  },

  /**
   * Obtiene los detalles de un artista específico
   */
  getById: async (id: string) => {
    return apiCall(`/api/artists/${id}`);
  },

  /**
   * Crea un nuevo artista
   */
  create: async (data: { nombre: string; matricula: string }) => {
    return apiCall('/api/artists', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Actualiza un artista existente
   */
  update: async (id: string, data: { nombre: string; matricula: string }) => {
    return apiCall(`/api/artists/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
};

// ==================== COMPAÑÍAS ====================
export const CompanyService = {
  /**
   * Obtiene un listado de compañías con búsqueda
   */
  list: async (search: string = '') => {
    return apiCall(`/api/companies?search=${encodeURIComponent(search)}`);
  },

  /**
   * Obtiene todas las compañías (sin filtros)
   */
  listAll: async () => {
    return apiCall('/api/companies');
  },

  /**
   * Obtiene los detalles de una compañía específica
   */
  getById: async (id: string) => {
    return apiCall(`/api/companies/${id}`);
  },

  /**
   * Crea una nueva compañía
   */
  create: async (formData: FormData) => {
    return apiCall('/api/companies', {
      method: 'POST',
      headers: {},
      body: formData,
      isFormData: true,
    });
  },

  /**
   * Actualiza una compañía existente
   */
  update: async (id: string, formData: FormData) => {
    return apiCall(`/api/companies/${id}`, {
      method: 'PUT',
      headers: {},
      body: formData,
      isFormData: true,
    });
  },
};

// ==================== PROYECTOS ====================
export const ProjectService = {
  /**
   * Obtiene un listado de proyectos con búsqueda y paginación
   */
  list: async (search: string = '', page: number = 1) => {
    return apiCall(
      `/api/proyectos?search=${encodeURIComponent(search)}&page=${page}`
    );
  },

  listAll: async (search: string = '', page: number = -1) => {
    return apiCall(
      `/api/proyectos?search=${encodeURIComponent(search)}&page=${page}`
    );
  },

  /**
   * Obtiene los detalles de un proyecto específico
   */
  getById: async (id: string) => {
    return apiCall(`/api/proyectos/${id}`);
  },

  /**
   * Crea un nuevo proyecto
   */
  create: async (formData: FormData) => {
    return apiCall('/api/proyectos', {
      method: 'POST',
      headers: {},
      body: formData,
      isFormData: true,
    });
  },

  /**
   * Actualiza un proyecto existente
   */
  update: async (id: string, formData: FormData) => {
    return apiCall(`/api/proyectos/${id}`, {
      method: 'PUT',
      headers: {},
      body: formData,
      isFormData: true,
    });
  },
};

// ==================== ROLES ====================
export const RoleService = {
  /**
   * Obtiene el listado de roles disponibles
   */
  list: async () => {
    return apiCall('/api/roles');
  },
};

// ==================== GENÉRICO ====================
export const ApiService = {
  /**
   * Realiza un fetch genérico (útil para testing o endpoints no estándar)
   */
  fetch: async (endpoint: string, method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET') => {
    return apiCall(endpoint, { method });
  },
};
