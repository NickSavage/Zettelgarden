
export interface User {
    id: number;
    username: string;
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