/* config/menu.js
 * SINGLE SOURCE OF TRUTH for all menu/course data.
 * Eras of Flavor — three chronological dining eras.
 * To update the menu: edit ONLY this file.
 */

export const MENU_ERAS = [
  {
    id: 'bhuta-kala',
    numeral: 'I',
    title: 'Bhuta Kala (Past)',
    statusLabel: 'Ancestral Vedic',
    statusType: 'archived',  // 'archived' | 'active' | 'speculative'
    courses: [
      {
        name: 'Soma Sourdough & Smoked Ghee',
        details: 'Six-day fermented wild sourdough starter baked over stone woodfire, served with wood-charred organic ghee extract.',
        metaLabel: 'Yuga I · Ancient Record',
        metaType: 'default',
      },
      {
        name: 'Panchamrut & Roasted Roots',
        details: 'Slow-steeped forest roots consommé, glazed with clarified milk, wild forest honey, and dried ginger dust.',
        metaLabel: 'Yuga I · Ancient Record',
        metaType: 'default',
      },
      {
        name: 'Ash-Crusted Tikka',
        details: 'Heritage jackfruit cubes (or cured venison) wrapped in burnt pine-ash masala, woodfire essence.',
        metaLabel: 'Yuga I · Ancient Record',
        metaType: 'default',
      },
    ],
  },

  {
    id: 'vartamana-kala',
    numeral: 'II',
    title: 'Vartamana (Present)',
    statusLabel: 'Harvested Today',
    statusType: 'active',
    highlighted: true,
    courses: [
      {
        name: 'Darjeeling Compressed Melon',
        details: 'Villa-garden melons compressed under vacuum with premium Darjeeling tea, cucumber oil drops.',
        metaLabel: 'Active Season Menu',
        metaType: 'active',
        accentName: true,
      },
      {
        name: 'Pomfret Skin & Curry Leaf Water',
        details: 'Coastal pomfret seared on skin, warm emulsion of garden curry leaves and ocean mineral water.',
        metaLabel: 'Active Season Menu',
        metaType: 'active',
      },
      {
        name: 'Cardamom Shrikhand Rose Cloud',
        details: 'Deconstructed cardamom curds, organic forest honey, topped with rosewater-distilled cloud foam.',
        metaLabel: 'Active Season Menu',
        metaType: 'active',
      },
    ],
  },

  {
    id: 'bhavishya-kala',
    numeral: 'III',
    title: 'Bhavishya (Future)',
    statusLabel: 'Speculative 2099',
    statusType: 'speculative',
    courses: [
      {
        name: 'Saffron Nitrogen Crystals',
        details: 'Liquid nitrogen-flash saffron cream shards, crispy aerated organic jaggery honeycomb panes.',
        metaLabel: 'Speculative Yuga · Era III',
        metaType: 'default',
        mutedName: true,
      },
      {
        name: 'Fermented Sandesh Neem-Oil Fat',
        details: 'Fermented cottage cheese paste, cold-extracted sweet neem-oil emulsion, salted sandesh sand.',
        metaLabel: 'Speculative Yuga · Era III',
        metaType: 'default',
        mutedName: true,
      },
      {
        name: 'Deconstructed Filter Coffee Ritual',
        details: 'Charred cedar-smoke glass dome, raw chicory coffee paste, ocean saline spray mist.',
        metaLabel: 'Speculative Yuga · Era III',
        metaType: 'default',
        mutedName: true,
      },
    ],
  },
];

/**
 * The secret 4th era — unlocked only by breaching the Amrit Vault.
 * Not rendered on page load. Injected by vault.js on success.
 */
export const AMRIT_YUGA_ERA = {
  id: 'amrit-yuga',
  numeral: 'IV',
  title: 'Amrit Yuga',
  statusLabel: 'VIP Celestial',
  statusType: 'vip',
  courses: [
    {
      name: 'Soma Elixir 2.0',
      details: 'Warm double-distilled saffron froth droplets in levitated honey suspension, cedar-sap vapor.',
      metaLabel: 'Satya Epoch · Ancient Future',
      metaType: 'vip',
    },
    {
      name: 'Zero-Gravity Ghee Rice',
      details: 'Speculative vacuum-puffed Basmati grains, 24k gold leaf ghee, Himalayan pine cream.',
      metaLabel: 'Satya Epoch · Ancient Future',
      metaType: 'vip',
    },
    {
      name: 'Swarga Cacao Pod',
      details: 'Gold-encrusted forest cacao shells filled with warm organic sandalwood distillate fat.',
      metaLabel: 'Satya Epoch · Ancient Future',
      metaType: 'vip',
    },
  ],
};
