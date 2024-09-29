export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  last_login: string;
  email_validated: boolean;
  can_upload_files: boolean;
  max_file_storage: number;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_subscription_status: string;
  stripe_subscription_frequency: string;
  stripe_current_plan: string;
  is_active: boolean;
  dashboard_card_pk: number;
}
export const defaultUser: User = {
  id: 0,
  username: "",
  email: "",
  password: "",
  created_at: "",
  updated_at: "",
  is_admin: false,
  last_login: "",
  email_validated: false,
  can_upload_files: false,
  max_file_storage: 0,
  stripe_customer_id: "",
  stripe_subscription_id: "",
  stripe_subscription_status: "",
  stripe_subscription_frequency: "",
  stripe_current_plan: "",
  is_active: false,
  dashboard_card_pk: 0,
};

export interface UserSubscription {
  id: number;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_subscription_status: string;
  stripe_subscription_frequency: string;
  stripe_current_plan: string;
  isActive: boolean;
}

export interface EditUserParams {
  username: string;
  email: string;
  is_admin: boolean;
  dashboard_card_pk: number;
}

export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateUserResponse {
  error: boolean;
  message: string;
  new_id: number;
  user: User;
}
