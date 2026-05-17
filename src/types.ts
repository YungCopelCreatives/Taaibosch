/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Capsules' | 'Seamoss' | 'Raw' | 'Gel';
export type HealthGoal = 'Immunity' | 'Energy' | 'Detox' | 'Skin' | 'Hormonal balance' | 'Metabolism' | 'Thyroid' | 'Digestion' | 'Cleansing' | 'Respiratory' | 'Vitality' | 'Relaxation' | 'Sleep' | 'Heart' | 'Nutrition' | 'Stress' | 'Blood';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  healthGoals: HealthGoal[];
  image: string;
  images?: string[];
  summary: string;
  headline?: string;
  hook?: string;
  whyPeopleChooseIt?: string;
  benefits?: string[];
  ingredients: string[];
  usage: string;
  whoItsFor: string;
  isBestSeller?: boolean;
  isTrending?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Courier = 'Aramex' | 'The Courier Guy' | 'PAXI';

export interface DeliveryDetails {
  courier: Courier;
  fullName: string;
  contactNumber: string;
  address?: string;
  lockerName?: string;
  pepStore?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  preview: string;
  image: string;
  topics: string[];
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
