export type Partner = {
  name: string
  domain: string
  // Optional: text shown ON the dropped stamp. Defaults to `name` when absent.
  displayName?: string
  // Optional: override the category's default geo / dimensions per-partner.
  geo?: string
  defaultW?: number
  defaultH?: number
  // Optional: small text rendered at the top of the stamp (above the main label).
  headerText?: string
  // Optional: explicit logo URL (overrides the Clearbit/favicon lookup).
  // Use for cases where the current logo from the domain doesn't match what
  // we want — e.g. the classic Twitter bird vs. the current "X" mark.
  logoUrl?: string
  // When true, the dropped stamp renders as the large flagship layout
  // (feature bullets) instead of the standard stamp.
  flagship?: boolean
  // Optional: override the category's color (a COLOR_HEX key) for this partner.
  color?: string
}

// Classic Twitter bird SVG, served as an inline data URL so it survives
// independently of Twitter's rebrand to X.
const TWITTER_BIRD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1d9bf0">' +
  '<path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>' +
  '</svg>'
export const TWITTER_LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(TWITTER_BIRD_SVG)}`

export type StampCategory = {
  id: string
  name: string
  geo: string
  color: string
  partners: Partner[]
  groupId?: string
  // Text shown on the auto-injected "Generic" stamp for this category
  // (e.g. "DSP" for the DSPs category). Defaults to the category name.
  genericLabel?: string
  // When true, this category does not get an auto-injected "Generic" stamp
  // (its partners are already generic ecosystem pieces).
  noGeneric?: boolean
}

export type StampGroup = {
  id: string
  name: string
  defaultOpen?: boolean
  // When true, child categories of this group are expanded by default.
  nestedDefaultOpen?: boolean
}

export const STAMP_GROUPS: StampGroup[] = [
  { id: 'permutive', name: 'Permutive', defaultOpen: true, nestedDefaultOpen: true },
  { id: 'staples', name: 'Staples', defaultOpen: true, nestedDefaultOpen: true },
  { id: 'activation', name: 'Activation', defaultOpen: true },
  { id: 'data-sources', name: 'Data Sources', defaultOpen: true },
  { id: 'etc', name: 'Etc', defaultOpen: true, nestedDefaultOpen: true },
  { id: 'identity-solutions', name: 'Identity Solutions', defaultOpen: true, nestedDefaultOpen: true },
]

export const STAMP_CATEGORIES: StampCategory[] = [
  {
    id: 'permutive',
    name: 'Permutive',
    geo: 'oval',
    color: 'permutive',
    groupId: 'permutive',
    genericLabel: 'Permutive',
    partners: [
      { name: 'Permutive', domain: 'permutive.com', flagship: true },
      { name: 'SDK', domain: '', displayName: 'SDK' },
      { name: 'DMP', domain: '', displayName: 'DMP' },
    ],
  },
  {
    id: 'digital-properties',
    name: 'Digital Properties',
    geo: 'rectangle',
    color: 'light-grey',
    groupId: 'staples',
    genericLabel: 'Digital Property',
    partners: [
      {
        name: 'Web',
        domain: '',
        displayName: '1P Data',
        geo: 'laptop',
        defaultW: 220,
        defaultH: 140,
        headerText: 'Web',
      },
      {
        name: 'App',
        domain: '',
        displayName: '1P Data',
        geo: 'phone',
        defaultW: 140,
        defaultH: 200,
        headerText: 'App',
      },
      {
        name: 'Audio',
        domain: '',
        displayName: '1P Data',
        geo: 'radio',
        defaultW: 200,
        defaultH: 140,
        headerText: 'Audio',
      },
      {
        name: 'CTV',
        domain: '',
        displayName: '1P Data',
        geo: 'monitor',
        defaultW: 220,
        defaultH: 140,
        headerText: 'CTV',
      },
      {
        name: 'FAST',
        domain: '',
        displayName: '1P Data',
        geo: 'monitor',
        defaultW: 220,
        defaultH: 140,
        headerText: 'FAST',
      },
    ],
  },
  {
    id: 'warehouses',
    name: 'Data Warehouses',
    geo: 'cylinder',
    color: 'pale-green',
    groupId: 'data-sources',
    genericLabel: 'Data Warehouse',
    partners: [
      { name: 'Snowflake', domain: 'snowflake.com' },
      { name: 'Databricks', domain: 'databricks.com' },
      { name: 'BigQuery', domain: 'cloud.google.com' },
      { name: 'AWS S3', domain: 'aws.amazon.com' },
      { name: 'GCS', domain: 'cloud.google.com' },
    ],
  },
  {
    id: 'cdps',
    name: 'CDPs',
    geo: 'cloud',
    color: 'light-blue',
    groupId: 'data-sources',
    genericLabel: 'CDP',
    partners: [
      { name: 'mParticle', domain: 'mparticle.com' },
      { name: 'Braze', domain: 'braze.com' },
      { name: 'Hightouch', domain: 'hightouch.com' },
      { name: 'Adobe CDP', domain: 'adobe.com' },
    ],
  },
  {
    id: 'esps',
    name: 'ESPs',
    geo: 'oval',
    color: 'light-red',
    groupId: 'data-sources',
    genericLabel: 'ESP',
    partners: [
      { name: 'Salesforce Marketing Cloud', domain: 'salesforce.com' },
      { name: 'Adestra', domain: 'adestra.com' },
      { name: 'Sailthru', domain: 'sailthru.com' },
    ],
  },
  {
    id: 'survey',
    name: 'Survey Tools',
    geo: 'rhombus',
    color: 'light-green',
    groupId: 'data-sources',
    genericLabel: 'Survey Tool',
    partners: [
      { name: 'Collective Audience', domain: 'collectiveaudience.co' },
      { name: 'Apester', domain: 'apester.com' },
      { name: 'Brand Metrics', domain: 'brandmetrics.com' },
      { name: 'Opinary', domain: 'opinary.com' },
      { name: 'Qualifio', domain: 'qualifio.com' },
    ],
  },
  {
    id: 'contextual',
    name: 'Contextual Classification',
    geo: 'pentagon',
    color: 'light-violet',
    groupId: 'data-sources',
    genericLabel: 'Contextual',
    partners: [
      { name: 'IBM Watson', domain: 'ibm.com' },
      { name: 'Silverbullet 4D', domain: 'silverbullet.tv' },
      { name: 'OS Data Solutions', domain: 'os-data-solutions.de' },
      { name: 'TextRazor', domain: 'textrazor.com' },
    ],
  },
  {
    id: 'dsps',
    name: 'DSPs',
    geo: 'oval',
    color: 'red',
    groupId: 'activation',
    genericLabel: 'DSP',
    partners: [
      { name: 'DV360', domain: 'doubleclickbygoogle.com' },
      { name: 'The Trade Desk', domain: 'thetradedesk.com' },
      { name: 'Adform', domain: 'adform.com' },
      { name: 'StackAdapt', domain: 'stackadapt.com' },
    ],
  },
  {
    id: 'ssps',
    name: 'SSPs',
    geo: 'octagon',
    color: 'orange',
    groupId: 'activation',
    genericLabel: 'SSP',
    partners: [
      { name: 'Microsoft Monetize (SSP)', domain: 'microsoft.com' },
      { name: 'OpenX', domain: 'openx.com' },
      { name: 'PubMatic', domain: 'pubmatic.com' },
      { name: 'Magnite', domain: 'magnite.com' },
      { name: 'Index Exchange', domain: 'indexexchange.com' },
    ],
  },
  {
    id: 'ad-servers',
    name: 'Ad Servers',
    geo: 'rectangle',
    color: 'blue',
    groupId: 'activation',
    genericLabel: 'Ad Server',
    partners: [
      { name: 'GAM', domain: 'admanager.google.com' },
      { name: 'Microsoft Monetize (Ad Server)', domain: 'microsoft.com' },
      { name: 'FreeWheel', domain: 'freewheel.com' },
      { name: 'Equativ', domain: 'equativ.com' },
      { name: 'Nativo', domain: 'nativo.com' },
      { name: 'AdsWizz', domain: 'adswizz.com' },
    ],
  },
  {
    id: 'video',
    name: 'Video Players',
    geo: 'oval',
    color: 'green',
    groupId: 'activation',
    genericLabel: 'Video Player',
    partners: [
      { name: 'YouTube', domain: 'youtube.com' },
      { name: 'Brightcove', domain: 'brightcove.com' },
      { name: 'JW Player', domain: 'jwplayer.com' },
      { name: 'Dailymotion', domain: 'dailymotion.com' },
    ],
  },
  {
    id: 'social-media',
    name: 'Social Media',
    geo: 'rectangle',
    color: 'social-teal',
    groupId: 'activation',
    genericLabel: 'Social Media',
    partners: [
      { name: 'Facebook', domain: 'facebook.com' },
      { name: 'Instagram', domain: 'instagram.com' },
      { name: 'Twitter', domain: 'twitter.com', logoUrl: TWITTER_LOGO_URL },
      { name: 'LinkedIn', domain: 'linkedin.com' },
      { name: 'Pinterest', domain: 'pinterest.com' },
      { name: 'TikTok', domain: 'tiktok.com' },
      { name: 'YouTube', domain: 'youtube.com' },
    ],
  },
  {
    id: 'identity-graph',
    name: 'Identity Graph',
    geo: 'table',
    color: 'excel-green',
    groupId: 'identity-solutions',
    genericLabel: 'Identity Graph',
    partners: [
      { name: 'TransUnion', domain: 'transunion.com' },
      { name: 'Experian', domain: 'experian.com' },
      { name: '1P Graph', domain: '' },
    ],
  },
  {
    id: 'identity',
    name: 'Identity Providers',
    geo: 'rectangle',
    color: 'yellow',
    groupId: 'identity-solutions',
    genericLabel: 'Identity Provider',
    partners: [
      { name: 'UID2', domain: 'unifiedid.com' },
      { name: 'ID5', domain: 'id5.io' },
      { name: 'RampID', domain: 'liveramp.com' },
    ],
  },
  {
    id: 'bidstream',
    name: 'Bidstream',
    geo: 'hexagon',
    color: 'violet',
    groupId: 'etc',
    genericLabel: 'Bidstream',
    partners: [
      { name: 'Prebid', domain: 'prebid.org' },
      { name: 'APS', domain: 'amazon.com' },
    ],
  },
  {
    id: 'general',
    name: 'General',
    geo: 'rectangle',
    color: 'grey',
    groupId: 'etc',
    noGeneric: true,
    partners: [
      { name: 'Advertiser', domain: '', color: 'red' },
      { name: 'Publisher', domain: '', color: 'orange' },
      {
        name: '3P Data Source',
        domain: '',
        displayName: 'e.g. Auto Intenders',
        headerText: '3P data source',
      },
    ],
  },
]

export const COLOR_HEX: Record<string, string> = {
  permutive: '#e691d7',
  blue: '#4263eb',
  violet: '#7048e8',
  orange: '#f08c00',
  red: '#e03131',
  'light-blue': '#4dabf7',
  'light-red': '#ff8787',
  grey: '#6b7280',
  'light-grey': '#d1d5db',
  'pale-green': '#7ec47e',
  'excel-green': '#107c41',
  'social-teal': '#14b8a6',
  yellow: '#f59f00',
  green: '#2f9e44',
  'light-violet': '#9775fa',
  'light-green': '#51cf66',
}
