export class ActivityDiaryEntryResponseDto {
  id: string;
  diary_id: string;
  exercise_id: string;
  sets_json: Array<{ reps: number; weight_kg: number }>;
  est_kcal: number;
  notes: string;
  created_at: string;
}
