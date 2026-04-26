export type WeeklyFormModality = "ONLINE" | "PRESENTIAL";

export type WeeklyFormBlock = {
  startTime: string;
  endTime: string;
  modality: WeeklyFormModality;
  addressId: string | null;
  sessionDurationMinutes: number;
  bufferBetweenSessionsMinutes: number;
  isActive: boolean;
};

export type WeeklyScheduleFormValues = {
  weekday: number;
  blocks: WeeklyFormBlock[];
};

export type WeeklyScheduleSubmitPayload = {
  weekday: number;
  blocks: WeeklyFormBlock[];
};
