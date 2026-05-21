import { Injectable, Logger } from '@nestjs/common';

// Bypass certificate validation to resolve 'unable to verify the first certificate' (UNABLE_TO_VERIFY_LEAF_SIGNATURE)
// which occurs in local dev environments due to proxies, security software, or outdated cert stores.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

@Injectable()
export class CotizacionesService {
  private readonly logger = new Logger(CotizacionesService.name);
  
  private cachedDolares: any = null;
  private lastDolaresFetched: number = 0;
  private cachedCryptos: any = null;
  private lastCryptosFetched: number = 0;

  private readonly DOLARES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos de caché para dólares
  private readonly CRYPTOS_CACHE_DURATION = 15 * 1000;     // 15 segundos de caché para cryptos (tiempo real)

  private getCriptoyaPrice(json: any): number {
    if (!json) return 0;
    const preferred = ['fiwind', 'letsbit', 'decrypto', 'satoshitango', 'ripio', 'buenbit'];
    for (const key of preferred) {
      if (json[key] && typeof json[key].ask === 'number') {
        return json[key].ask;
      }
    }
    const keys = Object.keys(json);
    if (keys.length > 0 && json[keys[0]] && typeof json[keys[0]].ask === 'number') {
      return json[keys[0]].ask;
    }
    return 0;
  }

  private async getDolares(): Promise<any> {
    const now = Date.now();
    if (this.cachedDolares && now - this.lastDolaresFetched < this.DOLARES_CACHE_DURATION) {
      this.logger.log('Retornando dólares desde caché');
      return this.cachedDolares;
    }

    this.logger.log('Obteniendo nuevas cotizaciones de dólares...');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const dolarRes = await fetch('https://dolarapi.com/v1/dolares', { headers });
    if (!dolarRes.ok) throw new Error('Error al obtener cotizaciones de DolarApi');
    const dolares = await dolarRes.json();

    const formattedDolares = dolares.reduce((acc: any, d: any) => {
      const key = d.casa === 'bolsa' ? 'mep' : d.casa;
      acc[key] = {
        nombre: d.nombre === 'Bolsa' ? 'Dólar MEP' : d.nombre,
        compra: d.compra,
        venta: d.venta,
        fecha: d.fechaActualizacion,
      };
      return acc;
    }, {});

    this.cachedDolares = formattedDolares;
    this.lastDolaresFetched = now;
    return formattedDolares;
  }

  private async getCryptos(mepVenta: number): Promise<any> {
    const now = Date.now();
    if (this.cachedCryptos && now - this.lastCryptosFetched < this.CRYPTOS_CACHE_DURATION) {
      this.logger.log('Retornando cryptos desde caché');
      return this.cachedCryptos;
    }

    this.logger.log('Obteniendo nuevas cotizaciones de cryptos...');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    let finalBtcUsd = 0;
    let finalEthUsd = 0;
    let finalBtcArs = 0;
    let finalEthArs = 0;

    // 1. Intentar obtener el precio SPOT global en tiempo real de Coinbase
    try {
      const [btcCoinbaseRes, ethCoinbaseRes] = await Promise.all([
        fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { headers }),
        fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', { headers })
      ]);

      if (btcCoinbaseRes.ok && ethCoinbaseRes.ok) {
        const btcData = await btcCoinbaseRes.json();
        const ethData = await ethCoinbaseRes.json();

        const btcUsd = parseFloat(btcData.data.amount);
        const ethUsd = parseFloat(ethData.data.amount);

        if (btcUsd > 0 && ethUsd > 0) {
          finalBtcUsd = btcUsd;
          finalEthUsd = ethUsd;
          // Calcular el valor en ARS usando el Dólar MEP de la app
          finalBtcArs = btcUsd * mepVenta;
          finalEthArs = ethUsd * mepVenta;
          this.logger.log(`Cotizaciones crypto obtenidas desde Coinbase (Spot Global). BTC: $${finalBtcUsd} USD, ETH: $${finalEthUsd} USD`);
        }
      }
    } catch (e) {
      this.logger.warn('Fallo al obtener cotizaciones de Coinbase, intentando fallback con CriptoYa...');
    }

    // 2. Fallback a CriptoYa si Coinbase falló o devolvió 0
    if (finalBtcUsd === 0 || finalEthUsd === 0) {
      try {
        const [btcUsdJson, ethUsdJson, btcArsJson, ethArsJson] = await Promise.all([
          fetch('https://criptoya.com/api/btc/usd', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('https://criptoya.com/api/eth/usd', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('https://criptoya.com/api/btc/ars', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('https://criptoya.com/api/eth/ars', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const btcUsd = this.getCriptoyaPrice(btcUsdJson);
        const ethUsd = this.getCriptoyaPrice(ethUsdJson);

        const btcArs = this.getCriptoyaPrice(btcArsJson);
        const ethArs = this.getCriptoyaPrice(ethArsJson);

        finalBtcUsd = btcUsd || (btcArs / mepVenta);
        finalEthUsd = ethUsd || (ethArs / mepVenta);

        finalBtcArs = btcArs || (finalBtcUsd * mepVenta);
        finalEthArs = ethArs || (finalEthUsd * mepVenta);

        this.logger.log(`Cotizaciones crypto obtenidas de CriptoYa (Fallback). BTC: $${finalBtcUsd} USD, ETH: $${finalEthUsd} USD`);
      } catch (e) {
        this.logger.error('Error al obtener cotizaciones de CriptoYa en fallback:', e);
      }
    }

    // 3. Fallback final a la caché previa si todo falla
    if (finalBtcUsd === 0 || finalEthUsd === 0) {
      if (this.cachedCryptos) {
        this.logger.warn('Fallo total de APIs de crypto. Usando última caché disponible.');
        return this.cachedCryptos;
      }
      throw new Error('No se pudieron obtener cotizaciones cripto de ninguna fuente');
    }

    this.cachedCryptos = {
      btc: {
        usd: finalBtcUsd,
        ars: finalBtcArs,
      },
      eth: {
        usd: finalEthUsd,
        ars: finalEthArs,
      },
    };
    this.lastCryptosFetched = now;
    return this.cachedCryptos;
  }

  async getCotizaciones() {
    try {
      const dolares = await this.getDolares();
      const mepVenta = dolares['mep']?.venta || dolares['blue']?.venta || dolares['oficial']?.venta || 1000;
      const cryptos = await this.getCryptos(mepVenta);

      return {
        dolares,
        cryptos,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      this.logger.error('Error al actualizar cotizaciones:', error);
      try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.resolve(__dirname, '../../cotizaciones-error.log');
        const logContent = `${new Date().toISOString()} - ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
        fs.appendFileSync(logPath, logContent);
      } catch (logErr) {
        this.logger.error('Error al escribir en archivo de log:', logErr);
      }

      // Fallback total con cachés previas si falla todo
      if (this.cachedDolares && this.cachedCryptos) {
        this.logger.warn('Retornando última versión completa de caché debido a error general');
        return {
          dolares: this.cachedDolares,
          cryptos: this.cachedCryptos,
          timestamp: Date.now(),
        };
      }
      throw error;
    }
  }
}

