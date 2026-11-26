export interface FeatureFlags {
  switchAccounts: boolean;
  labs: boolean;
}

export const FEATURES: FeatureFlags = {
  switchAccounts: process.env.NEXT_PUBLIC_FEATURE_SWITCH_ACCOUNTS === "true",
  labs: process.env.NEXT_PUBLIC_FEATURE_LABS === "true"
};

export const ACCOUNT_URL = process.env.NEXT_PUBLIC_ACCOUNT_URL ?? "";
