export interface EstadoBrasil {
  uf: string;
  nome: string;
  areaKm2: number;
}

// Áreas territoriais oficiais (IBGE), em km², usadas só para mostrar o
// "km² abrangidos" na extração por estado — não precisam ser recalculadas
// a partir do polígono.
export const ESTADOS_BRASIL: EstadoBrasil[] = [
  { uf: 'AC', nome: 'Acre', areaKm2: 164123.4 },
  { uf: 'AL', nome: 'Alagoas', areaKm2: 27767.7 },
  { uf: 'AP', nome: 'Amapá', areaKm2: 142470.8 },
  { uf: 'AM', nome: 'Amazonas', areaKm2: 1559146.9 },
  { uf: 'BA', nome: 'Bahia', areaKm2: 564760.4 },
  { uf: 'CE', nome: 'Ceará', areaKm2: 148894.4 },
  { uf: 'DF', nome: 'Distrito Federal', areaKm2: 5760.8 },
  { uf: 'ES', nome: 'Espírito Santo', areaKm2: 46074.4 },
  { uf: 'GO', nome: 'Goiás', areaKm2: 340242.8 },
  { uf: 'MA', nome: 'Maranhão', areaKm2: 329651.5 },
  { uf: 'MT', nome: 'Mato Grosso', areaKm2: 903378.8 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', areaKm2: 357145.5 },
  { uf: 'MG', nome: 'Minas Gerais', areaKm2: 586528.3 },
  { uf: 'PA', nome: 'Pará', areaKm2: 1245870.7 },
  { uf: 'PB', nome: 'Paraíba', areaKm2: 56490.0 },
  { uf: 'PR', nome: 'Paraná', areaKm2: 199298.9 },
  { uf: 'PE', nome: 'Pernambuco', areaKm2: 98067.9 },
  { uf: 'PI', nome: 'Piauí', areaKm2: 251577.7 },
  { uf: 'RJ', nome: 'Rio de Janeiro', areaKm2: 43750.4 },
  { uf: 'RN', nome: 'Rio Grande do Norte', areaKm2: 52809.6 },
  { uf: 'RS', nome: 'Rio Grande do Sul', areaKm2: 281730.2 },
  { uf: 'RO', nome: 'Rondônia', areaKm2: 237590.5 },
  { uf: 'RR', nome: 'Roraima', areaKm2: 224300.8 },
  { uf: 'SC', nome: 'Santa Catarina', areaKm2: 95730.7 },
  { uf: 'SP', nome: 'São Paulo', areaKm2: 248219.5 },
  { uf: 'SE', nome: 'Sergipe', areaKm2: 21915.1 },
  { uf: 'TO', nome: 'Tocantins', areaKm2: 277720.4 },
];
