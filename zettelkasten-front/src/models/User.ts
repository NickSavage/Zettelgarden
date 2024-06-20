
export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    is_admin: boolean;
    last_login: Date;
    email_validated: boolean;
    can_upload_files: boolean;
    max_file_storage: number;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    stripe_subscription_status: string;
    stripe_subscription_frequency: string;
    stripe_current_plan: string;
    is_active: boolean;
}
export const defaultUser: User = {
    id: 0,
    username: "",
    email: "",
    password: "",
    created_at: new Date(),
    updated_at: new Date(),
    is_admin: false,
    last_login: new Date(),
    email_validated: false,
    can_upload_files: false,
    max_file_storage: 0,
    stripe_customer_id: "",
    stripe_subscription_id: "",
    stripe_subscription_status: "",
    stripe_subscription_frequency: "",
    stripe_current_plan: "",
    is_active: false,
  };

export interface UserSubscription {
    id: number;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeSubscriptionStatus: string;
    stripeSubscriptionFrequency: string;
    stripeCurrentPlan: string;
    isActive: boolean;
}

export interface EditUserParams {
    username: string;
    email: string;
    is_admin: boolean;
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