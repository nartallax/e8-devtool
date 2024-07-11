export type ProjectObjectType = "model" | "particle" | "input bind" | "input bind group" | "collision group" | "layer"
export type ProjectObjectReferrer = {path: string, type: ProjectObjectType}