export type VType = 'Elettrico frontale 1,6 t' | 'Diesel 3,0 t' | 'Retrattile 1,4 t' | 'Transpallet elettrico 2,0 t'
export type VStatus = 'disponibile' | 'a_noleggio' | 'in_manutenzione' | 'fuori_servizio'
export interface Vehicle { id: string; type: VType; year: number; hours: number; nextServiceDue: string; status: VStatus; monthlyCost: number; note?: string }
export interface Contract { id: string; customer: string; vehicleId: string; start: string; end: string; monthlyFee: number; status: 'attivo' | 'chiuso' }
export type Priority = 'alta' | 'media' | 'bassa'
export interface WorkOrder { id: string; vehicleId: string; type: string; category: 'manutenzione' | 'assistenza'; priority: Priority; techId: string; due: string; hours: number; status: 'pianificato' | 'in_corso' | 'completato'; notes?: string }
export interface Part { id: string; code: string; name: string; stock: number; min: number; cost: number; supplier: string }
export interface Invoice { id: string; customer: string; kind: 'Noleggio' | 'Assistenza'; amount: number; date: string; due: string; status: 'pagata' | 'emessa' | 'scaduta' }
export interface Tech { id: string; name: string; skill: string; weeklyHours: number }

export const fee: Record<VType, number> = { 'Elettrico frontale 1,6 t': 640, 'Diesel 3,0 t': 780, 'Retrattile 1,4 t': 720, 'Transpallet elettrico 2,0 t': 380 }
const cost: Record<VType, number> = { 'Elettrico frontale 1,6 t': 310, 'Diesel 3,0 t': 390, 'Retrattile 1,4 t': 350, 'Transpallet elettrico 2,0 t': 170 }
const E = 'Elettrico frontale 1,6 t', D = 'Diesel 3,0 t', R = 'Retrattile 1,4 t', T = 'Transpallet elettrico 2,0 t'

const V = (n: number, type: VType, status: VStatus, due: string, hours: number, note?: string): Vehicle => ({ id: `FL-${n}`, type, year: 2018 + (n % 7), hours, nextServiceDue: due, status, monthlyCost: cost[type], note })
export const vehicles: Vehicle[] = [
  V(101, E, 'a_noleggio', '2027-01-18', 2140), V(102, E, 'disponibile', '2026-11-15', 3980),
  V(103, D, 'a_noleggio', '2026-12-12', 5120), V(104, E, 'a_noleggio', '2027-05-05', 1210),
  V(105, D, 'a_noleggio', '2027-02-02', 4380), V(106, R, 'a_noleggio', '2026-12-20', 2760),
  V(107, E, 'disponibile', '2026-11-17', 3340), V(108, R, 'a_noleggio', '2027-03-14', 1890),
  V(109, D, 'a_noleggio', '2026-11-25', 6020), V(110, E, 'a_noleggio', '2027-01-30', 2480),
  V(111, T, 'a_noleggio', '2027-02-26', 1520), V(112, D, 'disponibile', '2026-11-20', 3870),
  V(113, R, 'a_noleggio', '2027-04-09', 980), V(114, E, 'a_noleggio', '2026-12-02', 3050),
  V(115, T, 'a_noleggio', '2027-03-01', 2210), V(116, D, 'disponibile', '2026-11-24', 4710),
  V(117, T, 'disponibile', '2027-02-11', 1330), V(118, E, 'disponibile', '2027-01-08', 2590),
  V(119, R, 'in_manutenzione', '2026-11-09', 4200), V(120, D, 'in_manutenzione', '2026-11-10', 5560),
  V(121, R, 'fuori_servizio', '2026-11-08', 6310, 'Perdita impianto idraulico: fermo in attesa di diagnosi'),
  V(122, T, 'in_manutenzione', '2026-11-11', 3120),
]

const C = (n: number, customer: string, vehicleId: string, start: string, end: string): Contract => ({ id: `NL-26-${String(n).padStart(2, '0')}`, customer, vehicleId, start, end, monthlyFee: fee[vehicles.find((v) => v.id === vehicleId)!.type], status: 'attivo' })
export const contracts: Contract[] = [
  C(1, 'Ortofrutta Adriatica Srl', 'FL-101', '2026-03-01', '2027-02-28'), C(2, 'Logistica Piceno', 'FL-103', '2026-01-15', '2026-12-31'),
  C(3, 'Calzaturificio Monti', 'FL-104', '2026-06-01', '2027-05-31'), C(4, 'Edilmarche Spa', 'FL-105', '2025-12-01', '2026-11-30'),
  C(5, 'Cartotecnica Esino', 'FL-106', '2026-02-10', '2027-02-09'), C(6, 'Mobilificio Aurora', 'FL-108', '2026-04-01', '2027-03-31'),
  C(7, 'Frigo Conserve Spa', 'FL-109', '2026-05-20', '2026-12-05'), C(8, 'Metalmeccanica Tronto', 'FL-110', '2026-08-01', '2027-07-31'),
  C(9, 'Vetreria del Chienti', 'FL-111', '2026-09-01', '2027-08-31'), C(10, 'Agrimarche Coop', 'FL-113', '2026-07-01', '2027-06-30'),
  C(11, 'Tessile Fermana', 'FL-114', '2026-10-01', '2027-03-31'), C(12, 'Magazzini Pace', 'FL-115', '2026-10-15', '2027-04-14'),
]

export const techs: Tech[] = [
  { id: 't1', name: 'Paolo', skill: 'Elettrico e batterie', weeklyHours: 40 },
  { id: 't2', name: 'Luca', skill: 'Diesel e motori', weeklyHours: 40 },
  { id: 't3', name: 'Marco', skill: 'Sollevamento e idraulica', weeklyHours: 40 },
  { id: 't4', name: 'Davide', skill: 'Diagnosi e sicurezza', weeklyHours: 40 },
]

const O = (n: number, vehicleId: string, type: string, category: WorkOrder['category'], priority: Priority, techId: string, due: string, hours: number, status: WorkOrder['status'], notes?: string): WorkOrder => ({ id: `INT-${n}`, vehicleId, type, category, priority, techId, due, hours, status, notes })
export const orders: WorkOrder[] = [
  O(2041, 'FL-119', 'Tagliando 500 h', 'manutenzione', 'media', 't1', '2026-11-09', 26, 'in_corso'),
  O(2042, 'FL-120', 'Cambio batteria / gruppo motore', 'manutenzione', 'media', 't2', '2026-11-10', 18, 'in_corso'),
  O(2043, 'FL-122', 'Sostituzione catena di sollevamento', 'manutenzione', 'alta', 't3', '2026-11-11', 30, 'in_corso'),
  O(2044, 'FL-121', 'Diagnosi guasto impianto idraulico', 'assistenza', 'alta', 't4', '2026-11-10', 14, 'pianificato', 'Mezzo fermo: cliente in attesa di sostituzione'),
  O(2045, 'FL-112', 'Controllo sicurezza', 'manutenzione', 'bassa', 't1', '2026-11-20', 2, 'pianificato'),
  O(2046, 'FL-116', 'Revisione periodica', 'manutenzione', 'media', 't2', '2026-11-24', 3, 'pianificato'),
  O(2047, 'FL-109', 'Controllo sicurezza', 'manutenzione', 'bassa', 't4', '2026-11-25', 2, 'pianificato'),
  O(2038, 'FL-104', 'Tagliando 500 h', 'manutenzione', 'media', 't3', '2026-11-05', 6, 'completato'),
  O(2039, 'FL-113', 'Controllo freni', 'assistenza', 'media', 't1', '2026-11-06', 3, 'completato'),
]

export const parts: Part[] = [
  { id: 'r1', code: 'FO-110', name: 'Filtro olio idraulico', stock: 14, min: 6, cost: 18, supplier: 'Ricambi Centro Italia' },
  { id: 'r2', code: 'BA-48V', name: 'Batteria 48 V ricondizionata', stock: 1, min: 2, cost: 1450, supplier: 'Energia Industriale' },
  { id: 'r3', code: 'PN-SE', name: 'Pneumatico superelastico', stock: 8, min: 4, cost: 112, supplier: 'Ricambi Centro Italia' },
  { id: 'r4', code: 'FK-120', name: 'Forche 1,2 m (coppia)', stock: 3, min: 2, cost: 240, supplier: 'Sollevamento Marche' },
  { id: 'r5', code: 'CT-SL', name: 'Catena di sollevamento', stock: 4, min: 2, cost: 185, supplier: 'Sollevamento Marche' },
  { id: 'r6', code: 'CI-35', name: 'Cartuccia idraulica', stock: 1, min: 3, cost: 96, supplier: 'Idraulica Adriatica' },
  { id: 'r7', code: 'FR-KIT', name: 'Kit freni', stock: 6, min: 3, cost: 74, supplier: 'Ricambi Centro Italia' },
  { id: 'r8', code: 'LD-LED', name: 'Faro LED di lavoro', stock: 12, min: 4, cost: 42, supplier: 'Ricambi Centro Italia' },
  { id: 'r9', code: 'SN-INC', name: 'Sensore di inclinazione', stock: 5, min: 2, cost: 63, supplier: 'Idraulica Adriatica' },
  { id: 'r10', code: 'GU-KIT', name: 'Kit guarnizioni cilindro', stock: 9, min: 4, cost: 31, supplier: 'Idraulica Adriatica' },
]

const rentalInv = contracts.map((c, i): Invoice => ({ id: `FT-26-${String(311 + i)}`, customer: c.customer, kind: 'Noleggio', amount: c.monthlyFee, date: '2026-11-03', due: '2026-12-03', status: i < 7 ? 'pagata' : 'emessa' }))
export const invoices: Invoice[] = [
  ...rentalInv,
  { id: 'FT-26-323', customer: 'Calzaturificio Monti', kind: 'Assistenza', amount: 1240, date: '2026-11-04', due: '2026-11-08', status: 'scaduta' },
  { id: 'FT-26-324', customer: 'Logistica Piceno', kind: 'Assistenza', amount: 890, date: '2026-11-05', due: '2026-12-05', status: 'pagata' },
  { id: 'FT-26-325', customer: 'Agrimarche Coop', kind: 'Assistenza', amount: 1560, date: '2026-11-06', due: '2026-11-07', status: 'scaduta' },
  { id: 'FT-26-326', customer: 'Frigo Conserve Spa', kind: 'Assistenza', amount: 1100, date: '2026-11-07', due: '2026-12-07', status: 'emessa' },
]

export const utilizationHistory = [{ m: 'Giu', v: 58 }, { m: 'Lug', v: 61 }, { m: 'Ago', v: 52 }, { m: 'Set', v: 57 }, { m: 'Ott', v: 56 }]
export const revenueHistory = [{ m: 'Giu', v: 11480 }, { m: 'Lug', v: 11920 }, { m: 'Ago', v: 10240 }, { m: 'Set', v: 12160 }, { m: 'Ott', v: 12390 }]
export const ALERT_DAYS = 10
