import type { PollutantExplainer, PollutantId } from '@/src/types/airQuality';

export const POLLUTANT_EXPLAINERS: Record<PollutantId, PollutantExplainer> = {
  pm2_5: {
    id: 'pm2_5',
    name: 'Fine Particulate Matter',
    formula: 'PM2.5',
    plainSummary:
      'Microscopic airborne droplets and solid particles 2.5 micrometers or smaller — about 30 times thinner than a human hair.',
    urbanSources: [
      'Vehicle tailpipe exhaust and brake/tire wear',
      'Wildfire smoke, residential wood burning, and cooking',
      'Power plants, industrial combustion, and construction dust',
    ],
    healthEffects:
      'Because they are so small, PM2.5 particles bypass upper airway defenses, travel deep into lung alveoli, and can enter the bloodstream, triggering asthma flares and cardiovascular strain.',
    benchmarkSummary:
      'WHO 2021 24-hour guideline: 15 µg/m³ · US EPA 2024 Good threshold: ≤ 9.0 µg/m³.',
    reductionTips: [
      'Use a HEPA air purifier indoors when outdoor PM2.5 exceeds 15 µg/m³.',
      'Choose routes away from arterial highways during rush hour.',
    ],
  },
  pm10: {
    id: 'pm10',
    name: 'Coarse Particulate Matter',
    formula: 'PM10',
    plainSummary:
      'Inhalable dust, pollen, and soot particles up to 10 micrometers wide that settle in the nose, throat, and upper airways.',
    urbanSources: [
      'Road dust kicked up by traffic',
      'Construction, demolition, and unpaved surfaces',
      'Windblown soil, desert dust, and pollen grains',
    ],
    healthEffects:
      'Irritates eyes, nose, and throat, and worsens bronchitis or asthma symptoms during windy or dry urban conditions.',
    benchmarkSummary: 'WHO 2021 24-hour guideline: 45 µg/m³ · US EPA Good threshold: ≤ 54 µg/m³.',
    reductionTips: [
      'Rinse nasal passages after dusty commutes and close windows during high-wind dust events.',
    ],
  },
  no2: {
    id: 'no2',
    name: 'Nitrogen Dioxide',
    formula: 'NO₂',
    plainSummary:
      'A reddish-brown reactive gas produced whenever fuel is burned at high temperatures in engines and boilers.',
    urbanSources: [
      'Diesel and gasoline motor vehicles in dense traffic',
      'Gas stoves, space heaters, and commercial boilers',
      'Port equipment and urban power generation',
    ],
    healthEffects:
      'Inflames the lining of the lungs, reduces immunity to respiratory infections, and increases sensitivity to allergens in people with asthma.',
    benchmarkSummary:
      'WHO 2021 24-hour guideline: 25 µg/m³ · US EPA Good threshold: ≤ 53 ppb (~100 µg/m³).',
    reductionTips: [
      'Run range hoods when cooking on gas indoors and exercise one block off major traffic arteries.',
    ],
  },
  o3: {
    id: 'o3',
    name: 'Ground-Level Ozone',
    formula: 'O₃',
    plainSummary:
      'Unlike the protective ozone layer high in the stratosphere, ground-level ozone forms when sunlight cooks vehicle exhaust and industrial solvents.',
    urbanSources: [
      'Photochemical reactions between NOx and volatile organic compounds (VOCs) in sunlight',
      'Peak concentrations typically occur on hot, sunny afternoons',
    ],
    healthEffects:
      'Acts like a chemical sunburn inside the airways — causing chest tightness, coughing, throat irritation, and reduced lung capacity during outdoor exercise.',
    benchmarkSummary:
      'WHO 2021 8-hour guideline: 100 µg/m³ · US EPA Good threshold: ≤ 54 ppb (~106 µg/m³).',
    reductionTips: [
      'Schedule runs and outdoor labor in the early morning before afternoon sunlight builds ozone.',
    ],
  },
  so2: {
    id: 'so2',
    name: 'Sulfur Dioxide',
    formula: 'SO₂',
    plainSummary:
      'A sharp-smelling gas released when sulfur-containing fuels like coal or heavy marine fuel oil are burned.',
    urbanSources: [
      'Shipping ports and heavy marine diesel',
      'Coal/oil power stations, metal smelters, and refineries',
    ],
    healthEffects:
      'Rapidly constricts airways in people with asthma, even during short exposures of 10–15 minutes.',
    benchmarkSummary:
      'WHO 2021 24-hour guideline: 40 µg/m³ · US EPA Good threshold: ≤ 35 ppb (~92 µg/m³).',
    reductionTips: [
      'Stay indoors when wind blows from industrial or port corridors during SO₂ spikes.',
    ],
  },
  co: {
    id: 'co',
    name: 'Carbon Monoxide',
    formula: 'CO',
    plainSummary:
      'A colorless, odorless gas created by incomplete combustion of carbon fuels in vehicles and generators.',
    urbanSources: [
      'Idling vehicles in congested tunnels and street canyons',
      'Portable generators, wood stoves, and poorly vented heaters',
    ],
    healthEffects:
      'Reduces the blood’s ability to carry oxygen to the heart and brain, causing fatigue, headaches, or dizziness at elevated levels.',
    benchmarkSummary:
      'WHO 2021 24-hour guideline: 4,000 µg/m³ (4 mg/m³) · US EPA Good threshold: ≤ 4.4 ppm.',
    reductionTips: [
      'Avoid idling vehicles in enclosed garages and install a certified CO detector indoors.',
    ],
  },
};
