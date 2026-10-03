import type * as z from "zod";
import type { ubigeoTreeSchema } from "@/modules/checkout/domain/ubigeo";

/*
 * Mock ubigeo (INEI codes). A SUBSET, for the F1 mockups only:
 * - all 25 departamentos (Callao included as INEI's departamento 07);
 * - every provincia of Lima, Callao, Arequipa, Cusco, La Libertad, Piura and
 *   Lambayeque;
 * - every distrito of Lima Metropolitana (provincia 1501) and Callao (0701),
 *   the main urban distritos of Arequipa, Cusco, Trujillo, Piura and Chiclayo,
 *   and the capital distrito of every other provincia listed.
 * Other departamentos have only their capital provincia and distrito.
 * VERIFY against INEI's full table before production (F3 seeds the complete
 * list into Medusa's ubigeo-shipping module).
 */

type UbigeoFixture = z.input<typeof ubigeoTreeSchema>;
type Place = [code: string, name: string];

function provincia(code: string, name: string, distritos: Place[]) {
  return {
    code,
    name,
    distritos: distritos.map(([distritoCode, distritoName]) => ({
      code: distritoCode,
      name: distritoName,
    })),
  };
}

/** A provincia listed with its capital distrito only. */
function capital(code: string, name: string, capitalName = name) {
  return provincia(code, name, [[`${code}01`, capitalName]]);
}

function departamento(
  code: string,
  name: string,
  provincias: ReturnType<typeof provincia>[],
) {
  return { code, name, provincias };
}

export const UBIGEO_FIXTURE: UbigeoFixture = [
  departamento("01", "Amazonas", [capital("0101", "Chachapoyas")]),
  departamento("02", "Áncash", [capital("0201", "Huaraz")]),
  departamento("03", "Apurímac", [capital("0301", "Abancay")]),
  departamento("04", "Arequipa", [
    provincia("0401", "Arequipa", [
      ["040101", "Arequipa"],
      ["040102", "Alto Selva Alegre"],
      ["040103", "Cayma"],
      ["040104", "Cerro Colorado"],
      ["040107", "Jacobo Hunter"],
      ["040109", "Mariano Melgar"],
      ["040110", "Miraflores"],
      ["040112", "Paucarpata"],
      ["040117", "Sachaca"],
      ["040122", "Socabaya"],
      ["040126", "Yanahuara"],
      ["040129", "José Luis Bustamante y Rivero"],
    ]),
    capital("0402", "Camaná"),
    capital("0403", "Caravelí"),
    capital("0404", "Castilla", "Aplao"),
    capital("0405", "Caylloma", "Chivay"),
    capital("0406", "Condesuyos", "Chuquibamba"),
    capital("0407", "Islay", "Mollendo"),
    capital("0408", "La Unión", "Cotahuasi"),
  ]),
  departamento("05", "Ayacucho", [capital("0501", "Huamanga", "Ayacucho")]),
  departamento("06", "Cajamarca", [capital("0601", "Cajamarca")]),
  departamento("07", "Callao", [
    provincia("0701", "Callao", [
      ["070101", "Callao"],
      ["070102", "Bellavista"],
      ["070103", "Carmen de la Legua Reynoso"],
      ["070104", "La Perla"],
      ["070105", "La Punta"],
      ["070106", "Ventanilla"],
      ["070107", "Mi Perú"],
    ]),
  ]),
  departamento("08", "Cusco", [
    provincia("0801", "Cusco", [
      ["080101", "Cusco"],
      ["080102", "Ccorca"],
      ["080103", "Poroy"],
      ["080104", "San Jerónimo"],
      ["080105", "San Sebastián"],
      ["080106", "Santiago"],
      ["080107", "Saylla"],
      ["080108", "Wanchaq"],
    ]),
    capital("0802", "Acomayo"),
    capital("0803", "Anta"),
    capital("0804", "Calca"),
    capital("0805", "Canas", "Yanaoca"),
    capital("0806", "Canchis", "Sicuani"),
    capital("0807", "Chumbivilcas", "Santo Tomás"),
    capital("0808", "Espinar"),
    capital("0809", "La Convención", "Santa Ana"),
    capital("0810", "Paruro"),
    capital("0811", "Paucartambo"),
    capital("0812", "Quispicanchi", "Urcos"),
    capital("0813", "Urubamba"),
  ]),
  departamento("09", "Huancavelica", [capital("0901", "Huancavelica")]),
  departamento("10", "Huánuco", [capital("1001", "Huánuco")]),
  departamento("11", "Ica", [capital("1101", "Ica")]),
  departamento("12", "Junín", [capital("1201", "Huancayo")]),
  departamento("13", "La Libertad", [
    provincia("1301", "Trujillo", [
      ["130101", "Trujillo"],
      ["130102", "El Porvenir"],
      ["130103", "Florencia de Mora"],
      ["130104", "Huanchaco"],
      ["130105", "La Esperanza"],
      ["130106", "Laredo"],
      ["130107", "Moche"],
      ["130108", "Poroto"],
      ["130109", "Salaverry"],
      ["130110", "Simbal"],
      ["130111", "Víctor Larco Herrera"],
    ]),
    capital("1302", "Ascope"),
    capital("1303", "Bolívar"),
    capital("1304", "Chepén"),
    capital("1305", "Julcán"),
    capital("1306", "Otuzco"),
    capital("1307", "Pacasmayo", "San Pedro de Lloc"),
    capital("1308", "Pataz", "Tayabamba"),
    capital("1309", "Sánchez Carrión", "Huamachuco"),
    capital("1310", "Santiago de Chuco"),
    capital("1311", "Gran Chimú", "Cascas"),
    capital("1312", "Virú"),
  ]),
  departamento("14", "Lambayeque", [
    provincia("1401", "Chiclayo", [
      ["140101", "Chiclayo"],
      ["140105", "José Leonardo Ortiz"],
      ["140106", "La Victoria"],
      ["140112", "Pimentel"],
    ]),
    capital("1402", "Ferreñafe"),
    capital("1403", "Lambayeque"),
  ]),
  departamento("15", "Lima", [
    provincia("1501", "Lima", [
      ["150101", "Lima"],
      ["150102", "Ancón"],
      ["150103", "Ate"],
      ["150104", "Barranco"],
      ["150105", "Breña"],
      ["150106", "Carabayllo"],
      ["150107", "Chaclacayo"],
      ["150108", "Chorrillos"],
      ["150109", "Cieneguilla"],
      ["150110", "Comas"],
      ["150111", "El Agustino"],
      ["150112", "Independencia"],
      ["150113", "Jesús María"],
      ["150114", "La Molina"],
      ["150115", "La Victoria"],
      ["150116", "Lince"],
      ["150117", "Los Olivos"],
      ["150118", "Lurigancho"],
      ["150119", "Lurín"],
      ["150120", "Magdalena del Mar"],
      ["150121", "Pueblo Libre"],
      ["150122", "Miraflores"],
      ["150123", "Pachacámac"],
      ["150124", "Pucusana"],
      ["150125", "Puente Piedra"],
      ["150126", "Punta Hermosa"],
      ["150127", "Punta Negra"],
      ["150128", "Rímac"],
      ["150129", "San Bartolo"],
      ["150130", "San Borja"],
      ["150131", "San Isidro"],
      ["150132", "San Juan de Lurigancho"],
      ["150133", "San Juan de Miraflores"],
      ["150134", "San Luis"],
      ["150135", "San Martín de Porres"],
      ["150136", "San Miguel"],
      ["150137", "Santa Anita"],
      ["150138", "Santa María del Mar"],
      ["150139", "Santa Rosa"],
      ["150140", "Santiago de Surco"],
      ["150141", "Surquillo"],
      ["150142", "Villa El Salvador"],
      ["150143", "Villa María del Triunfo"],
    ]),
    capital("1502", "Barranca"),
    capital("1503", "Cajatambo"),
    capital("1504", "Canta"),
    capital("1505", "Cañete", "San Vicente de Cañete"),
    capital("1506", "Huaral"),
    capital("1507", "Huarochirí", "Matucana"),
    capital("1508", "Huaura", "Huacho"),
    capital("1509", "Oyón"),
    capital("1510", "Yauyos"),
  ]),
  departamento("16", "Loreto", [capital("1601", "Maynas", "Iquitos")]),
  departamento("17", "Madre de Dios", [capital("1701", "Tambopata")]),
  departamento("18", "Moquegua", [
    capital("1801", "Mariscal Nieto", "Moquegua"),
  ]),
  departamento("19", "Pasco", [capital("1901", "Pasco", "Chaupimarca")]),
  departamento("20", "Piura", [
    provincia("2001", "Piura", [
      ["200101", "Piura"],
      ["200104", "Castilla"],
      ["200105", "Catacaos"],
      ["200115", "Veintiséis de Octubre"],
    ]),
    capital("2002", "Ayabaca"),
    capital("2003", "Huancabamba"),
    capital("2004", "Morropón", "Chulucanas"),
    capital("2005", "Paita"),
    capital("2006", "Sullana"),
    capital("2007", "Talara", "Pariñas"),
    capital("2008", "Sechura"),
  ]),
  departamento("21", "Puno", [capital("2101", "Puno")]),
  departamento("22", "San Martín", [capital("2201", "Moyobamba")]),
  departamento("23", "Tacna", [capital("2301", "Tacna")]),
  departamento("24", "Tumbes", [capital("2401", "Tumbes")]),
  departamento("25", "Ucayali", [
    capital("2501", "Coronel Portillo", "Callería"),
  ]),
];
