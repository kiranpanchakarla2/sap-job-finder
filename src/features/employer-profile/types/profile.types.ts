export type EmployerPersonalProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  avatarUrl: string | null;
  companyRole: string | null;
  companyName: string | null;
};

export type EmployerPersonalProfileUpdate = {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  avatarUrl: string | null;
};

export type EmployerProfileServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
