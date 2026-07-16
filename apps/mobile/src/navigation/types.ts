export type HomeStackParamList = {
  Dashboard: undefined;
  PRList: undefined;
  PRDetail: { githubPrNumber: number };
  Analytics: undefined;
  Reviews: undefined;
};

export type ProjectsStackParamList = {
  Projects: undefined;
  ProjectDetail: { id: string };
  TaskDetail: { id: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type BoardStackParamList = {
  Board: undefined;
  TaskDetail: { id: string };
  NewFeature: undefined;
};

export type NotificationsStackParamList = {
  Notifications: undefined;
  NotificationDetail: { id: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  OrgSelect: undefined;
  Settings: undefined;
  Members: undefined;
};

export type AppTabsParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
  BoardTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};
