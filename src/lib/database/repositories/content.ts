import type { DeviceGroup } from "@/content/devices";
import type { ServiceItem } from "@/content/services";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export type MediaRecord = {
  id: string;
  storageKey: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  uploadedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HeroSlideRecord = {
  id: string;
  title: string;
  description: string;
  badge: string | null;
  imageId: string;
  imageAlt: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  includeInAutoplay: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: JsonValue;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string;
  coverImageId: string | null;
  authorId: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SiteSettingRecord = {
  key: string;
  value: JsonValue;
  type: string;
  updatedAt: Date;
};

export type AuditLogInput = {
  actorId: string;
  action:
    | "LOGIN"
    | "LOGIN_FAILURE"
    | "LOGOUT"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "PUBLISH"
    | "ARCHIVE"
    | "STATUS_CHANGE"
    | "SESSION_REVOKED"
    | "PASSWORD_CHANGED"
    | "ACCOUNT_LOCKED";
  entityType: string;
  entityId?: string;
  metadata?: Exclude<JsonValue, null>;
  ipAddress?: string;
  userAgent?: string;
};

export interface DeviceGroupRepository {
  listActive(): Promise<DeviceGroup[]>;
}

export interface ServiceRepository {
  listActive(): Promise<ServiceItem[]>;
}

export interface MediaRepository {
  findByStorageKey(storageKey: string): Promise<MediaRecord | null>;
}

export interface HeroSlideRepository {
  listActive(): Promise<HeroSlideRecord[]>;
}

export interface BlogRepository {
  listPublished(): Promise<BlogPostRecord[]>;
}

export interface SiteSettingRepository {
  getValue(key: string): Promise<SiteSettingRecord | null>;
}

export interface AuditLogRepository {
  append(entry: AuditLogInput): Promise<void>;
}
