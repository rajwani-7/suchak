export interface Community {
  id: string;
  name: string;
  avatar: string;
  members: number;
  lastActivity: string;
  description?: string;
  adminIds?: string[];
  subgroupIds?: string[];
  announcementGroupId?: string;
}
