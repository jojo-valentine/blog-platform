export interface IRole extends Document {
  name: string;
  permissions: string[];
  show: boolean;
  deletedAt: Date | null;
}
