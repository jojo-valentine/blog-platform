export interface IRole extends Document {
  name: string;
  permissions: string[];
}
