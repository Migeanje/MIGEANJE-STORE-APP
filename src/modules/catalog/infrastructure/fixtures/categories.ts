import type { Category } from "@/modules/catalog/domain/category";
import { spec } from "./helpers";

// Categories are product types. Apple is a brand, not a category: its three
// products go to "laptops", "tablets" and "audio", so AirPods Pro 3 can be
// compared with other earbuds and each spec schema stays meaningful.
// Specs that change per variant (length, memory, storage) are variant
// options, not specs.

const chargers: Category = {
  slug: "cargadores",
  name: "Cargadores",
  specSchema: [
    spec(10, "maxPower", "Potencia máxima", "number", {
      unit: "W",
      filterable: true,
    }),
    spec(20, "maxPortPower", "Potencia máxima por puerto", "number", {
      unit: "W",
    }),
    spec(30, "usbCPorts", "Puertos USB-C", "number", { filterable: true }),
    spec(40, "usbAPorts", "Puertos USB-A", "number"),
    spec(50, "protocols", "Protocolos de carga", "list"),
    spec(60, "display", "Pantalla", "boolean", { filterable: true }),
    spec(70, "dimensions", "Dimensiones", "text"),
    spec(80, "weight", "Peso", "number", { unit: "g" }),
  ],
};

const powerBanks: Category = {
  slug: "power-banks",
  name: "Power banks",
  specSchema: [
    spec(10, "capacity", "Capacidad", "number", {
      unit: "mAh",
      filterable: true,
    }),
    spec(20, "maxPower", "Potencia máxima", "number", {
      unit: "W",
      filterable: true,
    }),
    spec(30, "maxPortPower", "Potencia máxima por puerto", "number", {
      unit: "W",
    }),
    spec(40, "ports", "Puertos", "text"),
    spec(50, "inputPower", "Recarga del power bank", "number", { unit: "W" }),
    spec(60, "wireless", "Carga inalámbrica", "boolean", { filterable: true }),
    spec(70, "wirelessPower", "Potencia inalámbrica", "number", { unit: "W" }),
    spec(80, "display", "Pantalla", "boolean", { filterable: true }),
    spec(90, "dimensions", "Dimensiones", "text"),
    spec(100, "weight", "Peso", "number", { unit: "g" }),
  ],
};

const cables: Category = {
  slug: "cables",
  name: "Cables",
  specSchema: [
    spec(10, "connectors", "Conectores", "text", { filterable: true }),
    spec(20, "maxPower", "Potencia máxima", "number", {
      unit: "W",
      filterable: true,
    }),
    spec(30, "maxCurrent", "Corriente máxima", "number", { unit: "A" }),
    spec(40, "dataSpeed", "Transferencia de datos", "number", { unit: "Mbps" }),
    spec(50, "certification", "Certificación", "text", { filterable: true }),
    spec(60, "jacket", "Recubrimiento", "text"),
    spec(70, "bendLifespan", "Resistencia a dobleces", "number", {
      unit: "dobleces",
    }),
  ],
};

const hubsAndDocks: Category = {
  slug: "hubs-y-docks",
  name: "Hubs y docks",
  specSchema: [
    spec(10, "portCount", "Puertos en total", "number", { filterable: true }),
    spec(20, "hostConnection", "Conexión a tu equipo", "text", {
      filterable: true,
    }),
    spec(30, "videoOutputs", "Salidas de video", "text"),
    spec(40, "maxResolution", "Resolución máxima", "text"),
    spec(50, "laptopCharging", "Carga a tu laptop", "number", {
      unit: "W",
      filterable: true,
    }),
    spec(60, "maxDataSpeed", "Transferencia de datos máxima", "number", {
      unit: "Gbps",
    }),
    spec(70, "ethernet", "Ethernet", "number", { unit: "Gbps" }),
    spec(80, "cardReader", "Lector de tarjetas SD y microSD", "boolean"),
    spec(90, "adapterIncluded", "Adaptador de corriente incluido", "boolean"),
    spec(100, "dimensions", "Dimensiones", "text"),
  ],
};

const wirelessCharging: Category = {
  slug: "carga-inalambrica",
  name: "Carga inalámbrica",
  specSchema: [
    spec(10, "devices", "Equipos a la vez", "number", { filterable: true }),
    spec(20, "standard", "Estándar", "text", { filterable: true }),
    spec(30, "maxPhonePower", "Potencia para el celular", "number", {
      unit: "W",
      filterable: true,
    }),
    spec(40, "watchCharger", "Cargador de Apple Watch integrado", "boolean"),
    spec(50, "adapterIncluded", "Adaptador de corriente incluido", "boolean", {
      filterable: true,
    }),
    spec(60, "foldable", "Plegable", "boolean"),
    spec(70, "dimensions", "Dimensiones", "text"),
  ],
};

const audio: Category = {
  slug: "audio",
  name: "Audio",
  specSchema: [
    spec(10, "formFactor", "Tipo", "text", { filterable: true }),
    spec(20, "anc", "Cancelación de ruido activa", "boolean", {
      filterable: true,
    }),
    spec(30, "ldac", "LDAC (audio de alta resolución)", "boolean", {
      filterable: true,
    }),
    spec(40, "batteryAnc", "Batería con cancelación de ruido", "number", {
      unit: "h",
    }),
    spec(50, "batteryWithCase", "Batería total con estuche", "number", {
      unit: "h",
    }),
    spec(60, "heartRate", "Sensor de frecuencia cardiaca", "boolean"),
    spec(70, "waterResistance", "Resistencia al agua y al sudor", "text"),
    spec(80, "bluetooth", "Bluetooth", "text"),
    spec(90, "weight", "Peso", "text"),
  ],
};

const storage: Category = {
  slug: "almacenamiento",
  name: "Almacenamiento",
  specSchema: [
    spec(10, "type", "Tipo", "text", { filterable: true }),
    spec(20, "drives", "Unidades compatibles", "text"),
    spec(30, "sataSupport", "Compatible con SSD SATA", "boolean"),
    spec(40, "maxCapacity", "Capacidad máxima", "number", { unit: "TB" }),
    spec(50, "maxSpeed", "Velocidad máxima", "number", {
      unit: "Gbps",
      filterable: true,
    }),
    spec(60, "connectivity", "Conexiones", "text"),
    spec(70, "processor", "Procesador", "text"),
    spec(80, "memory", "Memoria RAM", "text"),
    spec(90, "toolFree", "Instalación sin herramientas", "boolean"),
  ],
};

const laptops: Category = {
  slug: "laptops",
  name: "Laptops",
  specSchema: [
    spec(10, "chip", "Chip", "text", { filterable: true }),
    spec(20, "cpuCores", "Núcleos de CPU", "number"),
    spec(30, "screenSize", "Pantalla", "number", {
      unit: "pulgadas",
      filterable: true,
    }),
    spec(40, "resolution", "Resolución", "text"),
    spec(50, "battery", "Batería (hasta)", "number", { unit: "h" }),
    spec(60, "weight", "Peso", "number", { unit: "kg" }),
    spec(70, "ports", "Puertos", "text"),
    spec(80, "wifi", "Wi-Fi", "text"),
  ],
};

const tablets: Category = {
  slug: "tablets",
  name: "Tablets",
  specSchema: [
    spec(10, "chip", "Chip", "text", { filterable: true }),
    spec(20, "cpuCores", "Núcleos de CPU", "number"),
    spec(30, "gpuCores", "Núcleos de GPU", "number"),
    spec(40, "memory", "Memoria", "number", { unit: "GB" }),
    spec(50, "screenSize", "Pantalla", "number", {
      unit: "pulgadas",
      filterable: true,
    }),
    spec(60, "wifi", "Wi-Fi", "text"),
    spec(70, "pencil", "Lápiz compatible", "text"),
  ],
};

export const CATEGORIES = {
  chargers,
  powerBanks,
  cables,
  hubsAndDocks,
  wirelessCharging,
  audio,
  storage,
  laptops,
  tablets,
};
