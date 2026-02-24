export type MaybePromise<T> = T | Promise<T>;

export type RowActionContext = {
  action: string;
  id: string;
  row: Element;
  target: HTMLElement;
  csrfToken: string;
};

export type BindCrudTableOptions = {
  basePath: string;
  csrfToken?: string;
  rowSelector?: string;
  deleteConfirm?: string;
  reloadOnSave?: boolean;
  reloadOnDelete?: boolean;
  mapFields?: (fields: Record<string, string>, row: Element) => Record<string, unknown>;
  extraActions?: Record<string, (ctx: RowActionContext) => MaybePromise<void>>;
};

export type BindCreateFormOptions = {
  formSelector: string;
  endpoint: string;
  csrfToken?: string;
  method?: "POST" | "PUT";
  onSuccess?: () => void;
};

export type BindJsonFormOptions = {
  formSelector: string;
  endpoint: string | ((form: HTMLFormElement, data: FormData) => string);
  csrfToken?: string;
  method?: "POST" | "PUT" | "PATCH";
  mapPayload?: (data: FormData, form: HTMLFormElement) => Record<string, unknown>;
  onSuccess?: () => void;
};
