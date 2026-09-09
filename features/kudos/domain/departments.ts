export interface DepartmentOption {
  label: string;
  value: number;
}

export const DEPARTMENTS: readonly DepartmentOption[] = [
  { label: "CEVC1", value: 1 },
  { label: "CEVC2", value: 2 },
  { label: "CEVC3", value: 3 },
  { label: "CEVC4", value: 4 },
];

export function departmentLabel(value: number): string {
  return DEPARTMENTS.find((department) => department.value === value)?.label ?? "";
}
