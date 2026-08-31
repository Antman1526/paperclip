export const PROTECTED_CATEGORIES = Object.freeze([
  "money",
  "production",
  "customer_data",
  "customer_messages",
  "accounts",
  "credentials",
  "legal_compliance",
  "public_posts",
  "external_services",
]);

export function classifyAction({ categories = [] } = {}) {
  const normalized = categories.filter((category) => PROTECTED_CATEGORIES.includes(category));
  return { protected: normalized.length > 0, categories: normalized };
}
