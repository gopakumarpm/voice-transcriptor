export interface Comment {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  transcriptionId: string;
  text: string;
  timestampRef?: number;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}
