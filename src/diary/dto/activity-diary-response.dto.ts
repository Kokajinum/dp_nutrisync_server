import { ActivityDiaryEntryResponseDto } from './activity-diary-entry-response.dto';

export class ActivityDiaryResponseDto {
  id: string;
  user_id: string;
  start_at: string;
  end_at: string;
  bodyweight_kg: number;
  notes: string;
  created_at: string;
  updated_at: string;
  entries?: ActivityDiaryEntryResponseDto[];
}
