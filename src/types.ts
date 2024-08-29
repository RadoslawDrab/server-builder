export interface TemplateData {
  projectName: string;
}
export interface ProjectOptions {
  projectName: string;
  ignoreFileName: string;
  projectPath: string;
  templatePath: string;
}

export type Choice = { name: string; value?: string } | string;
export type Config<Value, C extends Choice> = {
  message: string;
  nowrap?: boolean;
  prefix?: string;
  suffix?: string;
  orderedList?: boolean;
  choices: C[];
  transformer?: (choice: C) => C;
  resolve?: (choice: C) => Value;
  resolveOnValue?: C | null | ((choices: C[], transformer?: (choice: C) => C) => C | null);
};
