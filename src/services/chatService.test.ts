import { describe, it, expect } from 'vitest';
import { getModelById } from '@/constants/models';
import { hasPremiumModel } from '@/services/chatService';

describe('model utilities', () => {
  it('getModelById returns model object for gemini paid', () => {
    const m = getModelById('gemini-2.0-flash');
    expect(m).toBeDefined();
    expect(m?.inputPrice).toBeGreaterThan(0);
  });

  it('detects premium model when present', () => {
    const ids = ['google/gemini-2.0-flash-exp:free', 'gemini-2.0-flash'];
    expect(hasPremiumModel(ids)).toBe(true);
  });

  it('returns false when only free models present', () => {
    const ids = ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-72b-instruct:free'];
    expect(hasPremiumModel(ids)).toBe(false);
  });
});
