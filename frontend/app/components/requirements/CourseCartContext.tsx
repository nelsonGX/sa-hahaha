'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { RecommendedCourse } from './fakeRecommendationsApi';

export interface CartItem extends RecommendedCourse {
  addedFor: string; // category / area label
}

interface CourseCartCtx {
  items: CartItem[];
  add: (course: RecommendedCourse, addedFor: string) => void;
  remove: (code: string) => void;
  has: (code: string) => boolean;
}

const Ctx = createContext<CourseCartCtx | null>(null);

export function CourseCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((course: RecommendedCourse, addedFor: string) => {
    setItems(prev => prev.some(i => i.code === course.code) ? prev : [...prev, { ...course, addedFor }]);
  }, []);

  const remove = useCallback((code: string) => {
    setItems(prev => prev.filter(i => i.code !== code));
  }, []);

  const has = useCallback((code: string) => items.some(i => i.code === code), [items]);

  return <Ctx.Provider value={{ items, add, remove, has }}>{children}</Ctx.Provider>;
}

export function useCourseCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCourseCart must be used inside CourseCartProvider');
  return ctx;
}
