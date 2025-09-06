export type BoardId = string;
export interface UploadBoardRequest { 
  grid: boolean[][] | null;
}

export interface BoardStateResponse {
  id: BoardId;
  generation: number;
  width: number;
  height: number;
  aliveCount: number;
  grid: boolean[][] | null;
}

export interface FinalStateResponse {
  id: BoardId;
  finalGrid: boolean[][] | null;
  stepsTaken: number;
  isLoop: boolean;
  period: number;
  conclusion: string | null;
}
