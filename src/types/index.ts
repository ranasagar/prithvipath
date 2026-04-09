export type UserRole = "admin" | "editor" | "user";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  roleRequest?: {
    requestedRole: UserRole;
    status: "pending" | "approved" | "rejected";
    requestedAt: string;
    message?: string;
  };
  karma?: number;
  createdAt: any;
}

export interface Category {
  id: string;
  nameNepali: string;
  nameEnglish: string;
  slug: string;
  order: number;
  homepageStyle?: "grid" | "featured_list" | "cards" | "alternating" | "magazine" | "masonry" | "overlay";
  postCount?: number;
  isHidden?: boolean;
}

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  status: ArticleStatus;
  featuredImage: string;
  videoUrl?: string;
  views: number;
  commentCount?: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  districts?: string[];
  sourceUrls?: string[];
  editHistory?: {
    updatedAt: any;
    updatedBy: string;
    updatedByName: string;
  }[];
  createdAt: any;
  updatedAt: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: any;
  link?: string; // New: universal redirection
  articleId?: string; // Kept for backward compatibility
}

export interface ChautariPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  updatedAt: any;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isPinned?: boolean;
  isFlagged?: boolean;
}

export interface ChautariComment {
  id: string;
  postId: string;
  parentId?: string; // For nested replies
  replyToName?: string; // For '@user' display
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: any;
}

export interface YouTubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnail: string;
  category: 'trending' | 'nepal' | 'interview' | 'breaking' | 'documentary' | 'shorts';
  duration?: string;
  views?: number;
  isFeatured?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface ChautariVote {
  userId: string;
  postId: string;
  voteType: 1 | -1;
}

export type AdPosition = "sidebar" | "homepage_mid" | "article_bottom" | "header";

export interface Ad {
  id?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: AdPosition;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}
