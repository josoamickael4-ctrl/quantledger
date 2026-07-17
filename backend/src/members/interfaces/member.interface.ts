export interface Member {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  facebook?: string;
  accessCode: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
