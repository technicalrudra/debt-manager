export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  monthly_required: number;
  status: 'Active' | 'Completed' | 'Paused';
  created_at: string;
  updated_at: string;
}

export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at'>;
export type GoalUpdate = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
