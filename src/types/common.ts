export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export interface User {
  id: string;
  name: string;
  email: string;
  profile?: UserProfile;
}

export interface UserProfile {
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  injuries?: string[];
  goals?: string[];
}
