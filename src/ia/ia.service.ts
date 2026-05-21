import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmartInputResult {
  accion: 'crear' | 'eliminar';
  tipo?: 'ingreso' | 'gasto' | 'inversion';
  monto?: number;
  descripcion?: string;
  categoria?: string;
  fecha?: string;
  isCrypto?: boolean;
  cryptoSymbol?: string;
  cryptoQty?: number;
  cryptoBuyPrice?: number;
}

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
  }

  async parseText(text: string): Promise<SmartInputResult> {
    if (!this.apiKey) {
      this.logger.error('GEMINI_API_KEY no configurada en las variables de entorno.');
      throw new HttpException(
        'El servicio de Inteligencia Artificial no está configurado (falta GEMINI_API_KEY).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const today = new Date();
    // Formato de fecha local (YYYY-MM-DD)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;

    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeek = daysOfWeek[today.getDay()];

    const prompt = `Analiza la siguiente frase de un movimiento financiero y extrae sus datos estructurados según el esquema indicado.
Fecha de referencia de hoy: ${currentDateStr} (${dayOfWeek}).

Instrucciones:
1. Detecta si la intención del usuario es registrar/crear un nuevo movimiento ("crear") o eliminar/borrar uno existente ("eliminar"). Por ejemplo:
   - "Gasté 5000 en comida" => accion: "crear"
   - "Borrá el gasto de 5000 en comida de hoy" => accion: "eliminar"
   - "Cancelá la compra de BTC de ayer" => accion: "eliminar"
2. Llena los demás campos con la información que logres extraer. En caso de eliminación, extrae los filtros necesarios (ej. tipo, monto, descripción, fecha) para encontrar el registro a borrar.

Texto del usuario: "${text}"`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            accion: {
              type: 'STRING',
              enum: ['crear', 'eliminar'],
              description: 'Indica si el usuario desea crear/registrar un nuevo movimiento o eliminar/borrar uno existente.',
            },
            tipo: {
              type: 'STRING',
              enum: ['ingreso', 'gasto', 'inversion'],
              description: 'Tipo de movimiento afectado.',
            },
            monto: {
              type: 'NUMBER',
              description: 'El monto numérico de la transacción. Para eliminación, el monto a buscar.',
            },
            descripcion: {
              type: 'STRING',
              description: 'Concepto, lugar o nombre del activo (ej. Coto, Nafta, Sueldo, Uber, Compra BTC).',
            },
            categoria: {
              type: 'STRING',
              description: 'Categoría lógica (ej. Comida, Transporte, Ocio, Servicios, Sueldo, Crypto, Educación, etc.).',
            },
            fecha: {
              type: 'STRING',
              description: 'Fecha resuelta en formato YYYY-MM-DD según la fecha de referencia actual. Si dice "ayer", resta 1 día, etc.',
            },
            isCrypto: {
              type: 'BOOLEAN',
              description: 'Indica si es una compra o inversión en criptomonedas.',
            },
            cryptoSymbol: {
              type: 'STRING',
              description: 'Símbolo del token (BTC, ETH, SOL, etc.) en mayúsculas.',
            },
            cryptoQty: {
              type: 'NUMBER',
              description: 'Cantidad de criptomonedas compradas.',
            },
            cryptoBuyPrice: {
              type: 'NUMBER',
              description: 'Precio de compra unitario en dólares USD por token.',
            },
          },
          required: ['accion'],
        },
      },
    };

    let lastError: Error | null = null;
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

    for (const model of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          this.logger.log(`Llamando a Gemini API (Modelo: ${model}, Intento: ${attempt}/2)...`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            this.logger.warn(`Fallo de respuesta de Gemini API (${model}, Status ${response.status}): ${errorText}`);
            
            if (response.status === 403) {
              throw new Error(`API_KEY_INVALID: Gemini API retornó error 403: ${errorText}`);
            }
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              throw new Error(`MODEL_UNSUPPORTED: Gemini API retornó ${response.status}: ${errorText}`);
            }
            
            throw new Error(`Gemini API respondió con código de estado ${response.status}`);
          }

          const responseData = await response.json();
          const resultText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!resultText) {
            throw new Error('Respuesta vacía o inválida de la API de Gemini');
          }

          const resultJson = JSON.parse(resultText) as SmartInputResult;
          this.logger.log(`Texto parseado con éxito usando el modelo ${model}: "${text}" => ${JSON.stringify(resultJson)}`);
          return resultJson;
        } catch (error) {
          lastError = error;
          this.logger.warn(`Error en modelo ${model}, intento ${attempt}: ${error.message}`);
          
          if (error.message.includes('API_KEY_INVALID')) {
            throw error;
          }

          if (error.message.includes('MODEL_UNSUPPORTED')) {
            break; // Rompe el intento actual y pasa al siguiente modelo
          }

          // Espera breve con retardo antes de reintentar
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        }
      }
    }

    // Si fallaron todas las combinaciones y reintentos, lanzamos el último error capturado
    this.logger.error(`Fallo total al parsear texto con IA tras reintentos: ${lastError?.message}`);
    throw new HttpException(
      `Error al procesar el texto con Inteligencia Artificial: ${lastError?.message || 'Servicio no disponible'}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
