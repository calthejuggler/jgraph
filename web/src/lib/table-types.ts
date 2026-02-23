export interface TableApiResponse {
  states: (string | number)[];
  cells: (number | null)[][];
  ground_state: string | number;
  num_states: number;
  max_height: number;
  num_props: number;
}
