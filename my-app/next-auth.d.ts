import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      needsSetup?: boolean;
      kycStatus?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role?: UserRole;
    needsSetup?: boolean;
    kycStatus?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: UserRole;
    needsSetup?: boolean;
    kycStatus?: string;
  }
}

