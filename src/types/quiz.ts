export enum QuestionType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SCALE = 'scale',
  DATE = 'date',
  BOOLEAN = 'boolean'
}

export type QuestionOption = {
  id: string;
  value: string;
  label: string;
  order: number;
}

export type QuestionDependency = {
  questionId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';
  value: string | number | boolean | string[];
}

export type QuestionValidation = {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  variableName: string;
  options?: QuestionOption[];
  validations?: QuestionValidation[];
  dependency?: QuestionDependency;
  order: number;
}

export interface Quiz {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  questions: Question[];
  openingScreen?: {
    title: string;
    subtitle?: string;
    description?: string;
    startButtonText: string;
    showTimeEstimate: boolean;
    showQuestionCount: boolean;
  };
  completionScreen?: {
    title: string;
    message: string;
    redirectUrl?: string;
    redirectButtonText?: string;
  };
} 