export function createTableState<T extends { id: string }>(getRows: () => T[] = () => []) {
  let editedValues = $state<Record<string, Record<string, any>>>({});

  const onEdit = (id: string, field: string, value: any) => {
    if (!editedValues[id]) {
      editedValues[id] = {};
    }
    editedValues[id][field] = value;
  };

  const getEditedRow = (id: string) => {
    const original = getRows().find((r) => r.id === id);
    if (!original) return null;
    return { ...original, ...editedValues[id] };
  };

  const hasChanges = (id: string) => {
    return !!editedValues[id] && Object.keys(editedValues[id]).length > 0;
  };

  const clearChanges = (id: string) => {
    if (editedValues[id]) {
      delete editedValues[id];
    }
  };

  const reset = () => {
    editedValues = {};
  };

  return {
    get rows() {
      return getRows();
    },
    onEdit,
    getEditedRow,
    hasChanges,
    clearChanges,
    reset,
    get editedValues() {
      return editedValues;
    },
  };
}
