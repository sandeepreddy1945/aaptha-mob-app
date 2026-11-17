const configuredEmployeeId = process.env.EXPO_PUBLIC_EMPLOYEE_ID?.trim();

// The fallback matches the app's current demo profile; set the actual employee ID per deployment.
export const EMPLOYEE_ID = configuredEmployeeId || 'AAP-1048';
