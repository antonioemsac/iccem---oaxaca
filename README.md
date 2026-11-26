# Portal de Inteligencia Territorial – Oaxaca

Índice de Competitividad Económica Municipal (ICCEM) para los **570 municipios de Oaxaca**, ediciones 2022–2026 del DENUE (INEGI). Extiende el ICCEM-CIIT (46 municipios del Corredor Interoceánico) a todo el estado.

**Autor:** Dr. Antonio Salazar Campos — Universidad del Istmo (UNISTMO), Campus Ixtepec · ORCID 0000-0002-5245-9564

## Módulos

- **Capacidad competitiva:** ICCEM y sus seis dimensiones con nivel de capacidad, mapa coroplético o de calor (densidad de unidades económicas), hexágono de equilibrio, estructura sectorial y trayectoria.
- **Competitividad regional:** tablero de regiones o distritos, comparación A frente a B, matriz de dimensiones, cociente de localización por sector SCIAN y análisis shift-share.
- **Comparativo de años**, **sensibilidad de la ponderación** (escenarios y Monte Carlo), **ranking municipal**, **ficha resumen** y **metodología**.
- Filtros en cascada Región → Distrito → Municipio; 8 idiomas (español, inglés, Diidxazá parcial, francés, alemán, portugués, chino y japonés).
- Descargas: libro Excel, shapefile (WGS84) y reporte PDF del territorio elegido.

## Metodología (resumen)

Seis dimensiones con pesos ACP: D1 Diversificación 7.95 %, D2 Alto valor 16.54 %, D3 Manufactura 11.68 %, D4 Comercio y servicios 17.13 %, D5 Infraestructura 14.13 %, D6 Dinamismo 32.57 %. D2–D5 se calculan como log(1 + UE del grupo SCIAN) normalizado 0–100 con límites comunes a todos los años; D1 son los sectores activos de 23; D6 combina tamaño (50 %) y crecimiento de UE a tres años (50 %). Validación contra el ICCEM-CIIT oficial (46 municipios, 2025): Spearman 0.92.

## Fuentes

- INEGI, Directorio Estadístico Nacional de Unidades Económicas (DENUE), descarga masiva de Oaxaca: noviembre 2019–2024, mayo 2025 y noviembre 2026.
- INEGI, Censo de Población y Vivienda 2020; Marco Geoestadístico (vía GeoDa Center).
- Mapa base: © OpenStreetMap contributors (tile.openstreetmap.org).

## Actualización de datos

Los scripts de `scripts/` reproducen el cálculo: `agg.py` (conteos por municipio y sector), `build_data.py` (ICCEM), `sens.py` (escenarios y Monte Carlo), `heat.py` (rejilla de densidad) y `exports.py` (Excel y shapefile). Al publicarse una nueva edición del DENUE se agrega su año y se vuelven a ejecutar.

## Cómo citar

Salazar Campos, A. (2026). *Portal de Inteligencia Territorial – Oaxaca: Índice de Competitividad Económica Municipal (ICCEM), 570 municipios, 2022–2026*. Universidad del Istmo.
