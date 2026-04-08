const fallbackEmail = 'connect@luvfitnessworld.com';
const fallbackPassword = 'HabitShare@123';

export const defaultLoginCredential = {
  email: (process.env.NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL || fallbackEmail).trim(),
  password: (process.env.NEXT_PUBLIC_DEFAULT_LOGIN_PASSWORD || fallbackPassword).trim(),
};
