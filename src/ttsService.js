const OpenAI = require('openai');

const CACHE_EXPIRY_HOURS = 24;
const CACHE_MAX_SIZE = 1000;

const voiceCache = new Map();
const cacheTimestamps = new Map();

let openai = null;
let isOpenAIConfigured = false;

function checkOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
    isOpenAIConfigured = true;
    console.log('[TTS] OpenAI API configured');
  } else {
    console.warn('[TTS] OPENAI_API_KEY not set - using fallback');
  }
}

checkOpenAIKey();

const AVAILABLE_VOICES = {
  alloy: {
    id: 'alloy',
    name: 'Alloy',
    gender: 'neutral',
    description: 'Versatile & Neutral'
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    gender: 'male',
    description: 'Friendly & Warm'
  },
  fable: {
    id: 'fable',
    name: 'Fable',
    gender: 'male',
    description: 'Expressive & Storytelling'
  },
  onyx: {
    id: 'onyx',
    name: 'Onyx',
    gender: 'male',
    description: 'Deep & Authoritative'
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    gender: 'female',
    description: 'Energetic & Youthful'
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    gender: 'female',
    description: 'Soft & Gentle'
  },
  ash: {
    id: 'ash',
    name: 'Ash',
    gender: 'male',
    description: 'Casual & Natural'
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    gender: 'female',
    description: 'Bright & Expressive'
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    gender: 'female',
    description: 'Calm & Thoughtful'
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    gender: 'male',
    description: 'Neutral & Professional'
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    gender: 'female',
    description: 'Warm & Friendly'
  },
  auburn: {
    id: 'auburn',
    name: 'Auburn',
    gender: 'female',
    description: 'Rich & Engaging'
  },
  river: {
    id: 'river',
    name: 'River',
    gender: 'female',
    description: 'Flowing & Calm'
  }
};

const PERSONALITY_VOICES = {
  sassy: 'nova',
  grandma: 'shimmer',
  commentator: 'onyx',
  trash: 'alloy',
  confused: 'fable'
};

const DEFAULT_MODEL = 'tts-1';
const HD_MODEL = 'tts-1-hd';

function getCacheKey(voiceId, text) {
  return `${voiceId}:${text}`;
}

function isCacheValid(key) {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  
  const now = Date.now();
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  return (now - timestamp) < expiryMs;
}

function cleanupCache() {
  if (voiceCache.size > CACHE_MAX_SIZE) {
    const keysToDelete = [];
    const timestamps = Array.from(cacheTimestamps.entries());
    
    timestamps.sort((a, b) => a[1] - b[1]);
    
    const removeCount = Math.floor(CACHE_MAX_SIZE * 0.2);
    for (let i = 0; i < removeCount; i++) {
      keysToDelete.push(timestamps[i][0]);
    }
    
    keysToDelete.forEach(key => {
      voiceCache.delete(key);
      cacheTimestamps.delete(key);
    });
  }
}

function getVoiceByPersonality(personality) {
  const voiceId = PERSONALITY_VOICES[personality] || 'nova';
  return AVAILABLE_VOICES[voiceId] || AVAILABLE_VOICES.nova;
}

function getVoiceById(voiceId) {
  return AVAILABLE_VOICES[voiceId] || AVAILABLE_VOICES.alloy;
}

async function synthesizeSpeech(text, voiceId = 'alloy', model = DEFAULT_MODEL) {
  if (!isOpenAIConfigured) {
    throw new Error('OpenAI API not configured');
  }
  
  const cacheKey = getCacheKey(voiceId, text);
  
  if (voiceCache.has(cacheKey) && isCacheValid(cacheKey)) {
    console.log('[TTS] Cache hit for:', cacheKey.substring(0, 50));
    return voiceCache.get(cacheKey);
  }
  
  const voice = getVoiceById(voiceId);
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice.id,
      input: text,
      response_format: 'mp3',
      speed: 0.9
    });
    
    const audioBuffer = Buffer.from(await mp3.arrayBuffer());
    
    cleanupCache();
    voiceCache.set(cacheKey, audioBuffer);
    cacheTimestamps.set(cacheKey, Date.now());
    
    console.log('[TTS] Generated new audio, cache size:', voiceCache.size);
    
    return audioBuffer;
  } catch (error) {
    console.error('[TTS] OpenAI error:', error.message);
    throw error;
  }
}

function getAvailableVoices() {
  return Object.values(AVAILABLE_VOICES);
}

function getVoicesByGender(gender) {
  return Object.values(AVAILABLE_VOICES).filter(v => v.gender === gender);
}

function getCacheStats() {
  return {
    size: voiceCache.size,
    maxSize: CACHE_MAX_SIZE,
    expiryHours: CACHE_EXPIRY_HOURS
  };
}

function isConfigured() {
  return isOpenAIConfigured;
}

function clearCache() {
  voiceCache.clear();
  cacheTimestamps.clear();
  console.log('[TTS] Cache cleared');
}

module.exports = {
  synthesizeSpeech,
  getAvailableVoices,
  getVoicesByGender,
  getVoiceByPersonality,
  getVoiceById,
  PERSONALITY_VOICES,
  getCacheStats,
  isConfigured,
  clearCache,
  DEFAULT_MODEL,
  HD_MODEL
};
