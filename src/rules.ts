import type { CompetitionLevel, RedFlag } from './types.js';

export const MINIMUM_LIQUID_USD = 10;

export const KNOWN_LIQUID_STABLES = new Set(['USD', 'USDC', 'USDT']);

export const KNOWN_MAJOR_ASSETS = new Set(['HBAR', 'BTC', 'ETH', 'SOL']);

const RED_FLAG_PATTERNS: Array<{ flag: RedFlag; patterns: RegExp[] }> = [
  {
    flag: 'prompt_disclosure_required',
    patterns: [
      /\bsystem prompt\b/i,
      /\bdeveloper instructions\b/i,
      /\bprivate instructions\b/i,
      /\bfull platform initialization\b/i,
      /\bsession transcript\b/i,
      /\benvironment details\b/i,
    ],
  },
  {
    flag: 'symbolic_or_research_only',
    patterns: [/\bsymbolic\b/i, /\bresearch[- ]only\b/i, /\bacademic study\b/i],
  },
  {
    flag: 'fake_engagement_required',
    patterns: [/\bstar (?:the )?repo\b/i, /\bfake engagement\b/i, /\bsocial engagement\b/i],
  },
  {
    flag: 'credential_or_secret_request',
    patterns: [/\bprivate key\b/i, /\bseed phrase\b/i, /\bapi secret\b/i, /\bcredential\b/i],
  },
];

export function detectRedFlags(text: string): RedFlag[] {
  const flags = new Set<RedFlag>();

  for (const { flag, patterns } of RED_FLAG_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(text))) {
      flags.add(flag);
    }
  }

  return Array.from(flags);
}

export function competitionMultiplier(level: CompetitionLevel): number {
  switch (level) {
    case 'low':
      return 0.9;
    case 'medium':
      return 0.65;
    case 'high':
      return 0.4;
  }
}
