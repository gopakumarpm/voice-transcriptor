export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  projectId: string;
  parentFolderId?: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}
