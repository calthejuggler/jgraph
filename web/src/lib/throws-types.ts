export interface ThrowOption {
  height: number;
  destination: number;
}

export interface ThrowsApiResponse {
  throws: ThrowOption[];
  state: number;
  max_height: number;
  num_throws: number;
}
