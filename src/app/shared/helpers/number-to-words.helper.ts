export function numeroALetras(num: number): string {
  const unidades = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = [
    '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
  ];
  const especiales: any = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE'
  };
  const centenas = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
    'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
  ];

  function convertirGrupo(n: number): string {
    let letras = '';

    const cientos = Math.floor(n / 100);
    const resto = n % 100;
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;

    if (n === 100) return 'CIEN';
    if (cientos > 0) letras += centenas[cientos] + ' ';

    if (resto >= 11 && resto <= 15) {
      letras += especiales[resto];
    } else if (resto < 10) {
      letras += unidades[unidad];
    } else if (resto >= 10 && resto < 20) {
      letras += 'DIECI' + unidades[unidad].toLowerCase();
    } else if (resto >= 20 && unidad > 0) {
      letras += decenas[decena] + ' Y ' + unidades[unidad];
    } else if (resto >= 20) {
      letras += decenas[decena];
    }

    return letras.trim();
  }

  function seccion(num: number, divisor: number, singular: string, plural: string): string {
    const cientos = Math.floor(num / divisor);
    const resto = num - cientos * divisor;
    let letras = '';

    if (cientos === 0) return '';
    if (cientos === 1) letras = singular;
    else letras = convertirGrupo(cientos) + ' ' + plural;

    return letras;
  }

  function convertir(num: number): string {
    const millones = seccion(num, 1_000_000, 'UN MILLÓN', 'MILLONES');
    const miles = seccion(num % 1_000_000, 1000, 'MIL', 'MIL');
    const cientos = convertirGrupo(num % 1000);

    return [millones, miles, cientos].filter(p => p).join(' ').trim();
  }

  const enteros = Math.floor(num);
  const centavos = Math.round((num - enteros) * 100);

  let letras = convertir(enteros) + ' PESOS';
  if (centavos > 0) {
    letras += ` CON ${convertirGrupo(centavos)} CENTAVOS`;
  }

  return letras;
}
