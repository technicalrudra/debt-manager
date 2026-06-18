export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  country: string;
  company: string;
  job_title: string;
  employment_type: string;
  currency: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  onboarding_completed: boolean;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'user_id' | 'role' | 'status' | 'created_at' | 'updated_at'>>;
