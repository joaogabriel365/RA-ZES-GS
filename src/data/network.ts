// ============================================================================
//  DADOS SIMULADOS DA REDE RAÍZES
//  Todos os nomes de territórios, localidades e nós são FICTÍCIOS.
//  Edite à vontade: coordenadas (lat/lng), status, bateria etc.
//  Os enlaces LoRa são calculados automaticamente pelo alcance (LORA_RANGE_KM).
// ============================================================================
import type { MeshNode, Territory } from '../lib/types';

/** Alcance máximo considerado para um enlace LoRa entre dois nós (km). */
export const LORA_RANGE_KM = 24;

/** Limite de saltos da rede mesh (padrão máximo do Meshtastic). */
export const HOP_LIMIT = 7;

/** Tamanho máximo de payload útil em um pacote LoRa/Meshtastic (bytes). */
export const MAX_PAYLOAD_BYTES = 237;

export const territories: Territory[] = [
  { id: 't-igv', name: 'Território Igarapé Verde', short: 'Igarapé Verde', kind: 'indigena', center: [-4.2, -54.15], families: 86 },
  { id: 't-sjn', name: 'Comunidade Serra do Jenipapo', short: 'Serra do Jenipapo', kind: 'indigena', center: [-4.42, -53.78], families: 54 },
  { id: 't-rms', name: 'Quilombo Rio Manso', short: 'Rio Manso', kind: 'quilombola', center: [-4.38, -54.62], families: 112 },
  { id: 't-lgs', name: 'Comunidade Ribeirinha Lago Sereno', short: 'Lago Sereno', kind: 'ribeirinha', center: [-4.66, -54.3], families: 67 },
  { id: 't-cal', name: 'Reserva Extrativista Castanhal Alto', short: 'Castanhal Alto', kind: 'extrativista', center: [-4.86, -54.82], families: 141 },
  { id: 't-cds', name: 'Território Cabeceira do Sol', short: 'Cabeceira do Sol', kind: 'indigena', center: [-4.9, -53.98], families: 48 },
  { id: 't-mfd', name: 'Território Mata Funda', short: 'Mata Funda', kind: 'indigena', center: [-5.06, -54.52], families: 39 },
];

export const territoryKindLabel: Record<Territory['kind'], string> = {
  indigena: 'Indígena',
  quilombola: 'Quilombola',
  ribeirinha: 'Ribeirinha',
  extrativista: 'Extrativista',
  assentamento: 'Assentamento rural',
};

/**
 * Nós da rede. Tipos:
 *  - dispositivo: dispositivo comunitário (T-Deck) ou repetidor solar
 *  - estacao: estação comunitária com IA offline e sensores ambientais
 *  - gateway: nó com acesso à internet que publica na plataforma
 */
export const nodes: MeshNode[] = [
  {id: 'IGV-01', name: 'Escola', territoryId: 't-igv', type: 'dispositivo', lat: -4.2, lng: -54.15, status: 'online', battery: 66, solar: 2.7, rssi: -95, snr: 4, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'IGV-02', name: 'Estação Mirante', territoryId: 't-igv', type: 'estacao', lat: -4.155, lng: -54.0958, status: 'online', battery: 72, solar: 2.5, rssi: -91, snr: 3.1, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'IGV-03', name: 'Porto do Igarapé', territoryId: 't-igv', type: 'dispositivo', lat: -4.227, lng: -54.2042, status: 'online', battery: 93, solar: 6, rssi: -104, snr: 6.5, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'IGV-04', name: 'Roça Norte', territoryId: 't-igv', type: 'dispositivo', lat: -4.1009, lng: -54.1319, status: 'online', battery: 83, solar: 5.5, rssi: -96, snr: 2.8, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'IGV-05', name: 'Casa de Farinha', territoryId: 't-igv', type: 'dispositivo', lat: -4.245, lng: -54.0687, status: 'online', battery: 61, solar: 5.8, rssi: -106, snr: 10, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'IGV-06', name: 'Trilha Leste', territoryId: 't-igv', type: 'dispositivo', lat: -4.1189, lng: -54.0055, status: 'online', battery: 79, solar: 3, rssi: -95, snr: 4.3, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'IGV-07', name: 'Repetidor Castanheira', territoryId: 't-igv', type: 'dispositivo', lat: -4.2721, lng: -54.3307, status: 'online', battery: 96, solar: 5.4, rssi: -83, snr: 9.5, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'SJN-01', name: 'Barracão', territoryId: 't-sjn', type: 'dispositivo', lat: -4.42, lng: -53.78, status: 'online', battery: 76, solar: 2.6, rssi: -79, snr: 6.8, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'SJN-02', name: 'Estação Torre da Serra', territoryId: 't-sjn', type: 'estacao', lat: -4.3659, lng: -53.8252, status: 'online', battery: 92, solar: 5.4, rssi: -98, snr: 5.4, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'SJN-03', name: 'Posto de Saúde', territoryId: 't-sjn', type: 'dispositivo', lat: -4.456, lng: -53.7348, status: 'online', battery: 81, solar: 4.9, rssi: -99, snr: 8.5, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'SJN-04', name: 'Cabeceira', territoryId: 't-sjn', type: 'dispositivo', lat: -4.4741, lng: -53.8613, status: 'offline', battery: 10, solar: 0, rssi: -91, snr: 2.9, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'SJN-05', name: 'Mirante Norte', territoryId: 't-sjn', type: 'dispositivo', lat: -4.2759, lng: -53.8161, status: 'online', battery: 63, solar: 4, rssi: -82, snr: 8.9, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'SJN-06', name: 'Repetidor Serra do Sul', territoryId: 't-sjn', type: 'dispositivo', lat: -4.5822, lng: -53.7619, status: 'online', battery: 81, solar: 5.3, rssi: -90, snr: 3.9, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'RMS-01', name: 'Sede da Associação', territoryId: 't-rms', type: 'dispositivo', lat: -4.38, lng: -54.62, status: 'online', battery: 67, solar: 2.5, rssi: -86, snr: 5, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'RMS-02', name: 'Estação Porto Velho', territoryId: 't-rms', type: 'estacao', lat: -4.425, lng: -54.6742, status: 'online', battery: 94, solar: 5.8, rssi: -84, snr: 9.8, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'RMS-03', name: 'Roça Comunitária', territoryId: 't-rms', type: 'dispositivo', lat: -4.344, lng: -54.5568, status: 'online', battery: 81, solar: 3.6, rssi: -87, snr: 3.2, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'RMS-04', name: 'Escola Quilombola', territoryId: 't-rms', type: 'dispositivo', lat: -4.4521, lng: -54.5929, status: 'online', battery: 98, solar: 2.8, rssi: -106, snr: 9.3, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'RMS-05', name: 'Ponte do Manso', territoryId: 't-rms', type: 'dispositivo', lat: -4.335, lng: -54.7284, status: 'instavel', battery: 74, solar: 5, rssi: -114, snr: -5.5, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'RMS-06', name: 'Casa de Farinha', territoryId: 't-rms', type: 'dispositivo', lat: -4.4341, lng: -54.5206, status: 'online', battery: 77, solar: 2.8, rssi: -85, snr: 7.4, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'RMS-07', name: 'Igarapé Fundo', territoryId: 't-rms', type: 'dispositivo', lat: -4.3079, lng: -54.4935, status: 'online', battery: 86, solar: 4.2, rssi: -84, snr: 4, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'RMS-08', name: 'Repetidor Ramal do Manso', territoryId: 't-rms', type: 'dispositivo', lat: -4.5061, lng: -54.7465, status: 'online', battery: 86, solar: 5.6, rssi: -103, snr: 8.3, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'LGS-01', name: 'Flutuante', territoryId: 't-lgs', type: 'dispositivo', lat: -4.66, lng: -54.3, status: 'online', battery: 92, solar: 3.8, rssi: -83, snr: 3.1, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'LGS-02', name: 'Estação Régua do Lago', territoryId: 't-lgs', type: 'estacao', lat: -4.624, lng: -54.2638, status: 'online', battery: 79, solar: 4.7, rssi: -108, snr: 5.8, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'LGS-03', name: 'Porto Comunitário', territoryId: 't-lgs', type: 'dispositivo', lat: -4.642, lng: -54.3633, status: 'online', battery: 88, solar: 3.9, rssi: -79, snr: 2.7, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'LGS-04', name: 'Ilha Grande', territoryId: 't-lgs', type: 'dispositivo', lat: -4.7141, lng: -54.2277, status: 'online', battery: 91, solar: 5.9, rssi: -102, snr: 3.5, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'LGS-05', name: 'Paraná do Meio', territoryId: 't-lgs', type: 'dispositivo', lat: -4.7501, lng: -54.3181, status: 'instavel', battery: 72, solar: 3.4, rssi: -116, snr: -2.6, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'LGS-06', name: 'Boca do Lago', territoryId: 't-lgs', type: 'dispositivo', lat: -4.5339, lng: -54.2819, status: 'online', battery: 95, solar: 3.1, rssi: -87, snr: 6.8, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'LGS-07', name: 'Repetidor Ilha do Meio', territoryId: 't-lgs', type: 'dispositivo', lat: -4.4798, lng: -54.4085, status: 'online', battery: 67, solar: 3.9, rssi: -78, snr: 7.8, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'LGS-08', name: 'Repetidor Paraná Sul', territoryId: 't-lgs', type: 'dispositivo', lat: -4.7861, lng: -54.1554, status: 'online', battery: 71, solar: 4.1, rssi: -86, snr: 7.3, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'CAL-01', name: 'Barracão da Castanha', territoryId: 't-cal', type: 'dispositivo', lat: -4.86, lng: -54.82, status: 'online', battery: 86, solar: 4.4, rssi: -96, snr: 4.1, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CAL-02', name: 'Estação Castanhal', territoryId: 't-cal', type: 'estacao', lat: -4.824, lng: -54.7658, status: 'online', battery: 72, solar: 3.9, rssi: -106, snr: 4.1, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'CAL-03', name: 'Colocação Seringal', territoryId: 't-cal', type: 'dispositivo', lat: -4.896, lng: -54.8833, status: 'online', battery: 96, solar: 5.8, rssi: -95, snr: 10.3, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CAL-04', name: 'Ramal Sul', territoryId: 't-cal', type: 'dispositivo', lat: -4.9501, lng: -54.8019, status: 'offline', battery: 4, solar: 0, rssi: -86, snr: 6.9, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CAL-05', name: 'Colocação Norte', territoryId: 't-cal', type: 'dispositivo', lat: -4.7519, lng: -54.8562, status: 'online', battery: 77, solar: 5.8, rssi: -107, snr: 8.4, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CAL-06', name: 'Ponto do Rio', territoryId: 't-cal', type: 'dispositivo', lat: -4.878, lng: -54.7025, status: 'online', battery: 91, solar: 3.5, rssi: -95, snr: 8.2, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CAL-07', name: 'Igarapé do Breu', territoryId: 't-cal', type: 'dispositivo', lat: -4.9591, lng: -54.7386, status: 'online', battery: 57, solar: 3.6, rssi: -92, snr: 8.9, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CAL-08', name: 'Ramal Oeste', territoryId: 't-cal', type: 'dispositivo', lat: -4.8059, lng: -54.9466, status: 'online', battery: 98, solar: 2.5, rssi: -95, snr: 4.7, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CDS-01', name: 'Centro Comunitário', territoryId: 't-cds', type: 'dispositivo', lat: -4.9, lng: -53.98, status: 'online', battery: 83, solar: 4.8, rssi: -92, snr: 4.3, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CDS-02', name: 'Estação Cabeceira', territoryId: 't-cds', type: 'estacao', lat: -4.855, lng: -54.0252, status: 'online', battery: 87, solar: 4.2, rssi: -79, snr: 9.6, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'CDS-03', name: 'Roça Sul', territoryId: 't-cds', type: 'dispositivo', lat: -4.9631, lng: -53.9438, status: 'online', battery: 87, solar: 5.7, rssi: -100, snr: 6.8, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CDS-04', name: 'Trilha do Sol', territoryId: 't-cds', type: 'dispositivo', lat: -4.936, lng: -54.0704, status: 'online', battery: 99, solar: 5.9, rssi: -97, snr: 9.1, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CDS-05', name: 'Ponto da Cachoeira', territoryId: 't-cds', type: 'dispositivo', lat: -4.8279, lng: -53.9077, status: 'online', battery: 57, solar: 4.4, rssi: -96, snr: 4.2, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'CDS-06', name: 'Repetidor Morro do Sol', territoryId: 't-cds', type: 'dispositivo', lat: -4.7018, lng: -53.9257, status: 'online', battery: 88, solar: 2.5, rssi: -106, snr: 6, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'MFD-01', name: 'Escola', territoryId: 't-mfd', type: 'dispositivo', lat: -5.06, lng: -54.52, status: 'online', battery: 71, solar: 4.5, rssi: -95, snr: 2.3, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'MFD-02', name: 'Estação Mata Funda', territoryId: 't-mfd', type: 'estacao', lat: -5.105, lng: -54.4748, status: 'online', battery: 73, solar: 4.5, rssi: -80, snr: 3.3, hardware: 'Estação RAÍZES · ESP32-S3 + SX1262 + Raspberry Pi 5'},
  {id: 'MFD-03', name: 'Porto', territoryId: 't-mfd', type: 'dispositivo', lat: -5.024, lng: -54.5743, status: 'instavel', battery: 60, solar: 3.3, rssi: -114, snr: -3.8, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'MFD-04', name: 'Clareira', territoryId: 't-mfd', type: 'dispositivo', lat: -4.9969, lng: -54.4296, status: 'online', battery: 74, solar: 5.9, rssi: -98, snr: 7.4, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'MFD-05', name: 'Roça Leste', territoryId: 't-mfd', type: 'dispositivo', lat: -5.096, lng: -54.3843, status: 'online', battery: 71, solar: 4.9, rssi: -86, snr: 10.2, hardware: 'LILYGO T-Deck · ESP32-S3 + SX1262'},
  {id: 'MFD-06', name: 'Repetidor Morro Alto', territoryId: 't-mfd', type: 'dispositivo', lat: -4.8978, lng: -54.4476, status: 'online', battery: 94, solar: 4.4, rssi: -98, snr: 8.7, hardware: 'Repetidor solar · ESP32-S3 + SX1262'},
  {id: 'GW-01', name: 'Gateway Porto Esperança', territoryId: null, type: 'gateway', lat: -4.1, lng: -53.86, status: 'online', battery: 81, solar: 10.2, rssi: -82, snr: 4.1, hardware: 'Raspberry Pi 4 + módulo LoRa SX1262', connection: 'Fibra/Ethernet', place: 'Porto Esperança'},
  {id: 'GW-02', name: 'Gateway Vila Boa Vista', territoryId: null, type: 'gateway', lat: -4.6, lng: -54.88, status: 'online', battery: 60, solar: 10.9, rssi: -91, snr: 9, hardware: 'Raspberry Pi 4 + módulo LoRa SX1262', connection: 'Celular 4G', place: 'Vila Boa Vista'},
  {id: 'GW-03', name: 'Gateway Posto Santa Clara', territoryId: null, type: 'gateway', lat: -5.1, lng: -54.2, status: 'online', battery: 83, solar: 16.1, rssi: -87, snr: 8.2, hardware: 'Raspberry Pi 4 + módulo LoRa SX1262', connection: 'Satélite', place: 'Posto Santa Clara'}
];

/** Gateway preferencial (o que publica na plataforma quando está online). */
export const PRIMARY_GATEWAY_ID = 'GW-01';
