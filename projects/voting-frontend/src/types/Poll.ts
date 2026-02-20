export interface Poll {
  id: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  votes1: number;
  votes2: number;
  votes3: number;
  active: boolean;
  endTime: number;
  creator: string;
  hasVoted: boolean;
  userChoice?: number; // The option the user voted for (1, 2, or 3)
  totalVotes?: number; // Total number of votes
}

export interface CreatePollForm {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  duration: string;
}
