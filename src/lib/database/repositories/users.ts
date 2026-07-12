import type { Role } from "@/lib/rbac/permissions";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SafeUserDto = Omit<UserRecord, "passwordHash">;

export interface UserRepository {
  findByEmail(email: string): Promise<SafeUserDto | null>;
}

export type PrismaUserClient = {
  user: {
    findUnique(args: {
      where: { email: string };
    }): Promise<UserRecord | null>;
  };
};

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly client: PrismaUserClient) {}

  async findByEmail(email: string) {
    const user = await this.client.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    return user ? toSafeUserDto(user) : null;
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toSafeUserDto(user: UserRecord): SafeUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
