'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/**
 * Signs in with the supplied credential, or creates the account on first use.
 * This is intended for a starter credential on a fresh Firebase project.
 */
export async function ensureEmailAccount(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(authInstance, email, password);
  } catch (signInError: any) {
    const signInCode = signInError?.code as string | undefined;
    const canCreateAccount =
      signInCode === 'auth/user-not-found' ||
      signInCode === 'auth/invalid-credential' ||
      signInCode === 'auth/invalid-login-credentials';

    if (!canCreateAccount) {
      throw signInError;
    }

    try {
      return await createUserWithEmailAndPassword(authInstance, email, password);
    } catch (signUpError: any) {
      if (signUpError?.code === 'auth/email-already-in-use') {
        throw new Error('Starter account already exists, but the saved password does not match.');
      }

      throw signUpError;
    }
  }
}
