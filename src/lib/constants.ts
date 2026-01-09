export const SPECIALTIES = {
  general_medicine: { label: "General Medicine", icon: "Stethoscope" },
  cardiology: { label: "Cardiology", icon: "Heart" },
  dermatology: { label: "Dermatology", icon: "Sparkles" },
  orthopedics: { label: "Orthopedics", icon: "Bone" },
  pediatrics: { label: "Pediatrics", icon: "Baby" },
  neurology: { label: "Neurology", icon: "Brain" },
  psychiatry: { label: "Psychiatry", icon: "Brain" },
  gynecology: { label: "Gynecology", icon: "Heart" },
  ophthalmology: { label: "Ophthalmology", icon: "Eye" },
  dentistry: { label: "Dentistry", icon: "Smile" },
  ent: { label: "ENT", icon: "Ear" },
  gastroenterology: { label: "Gastroenterology", icon: "Activity" },
} as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const APPOINTMENT_STATUS = {
  pending: { label: "Pending", color: "warning" },
  confirmed: { label: "Confirmed", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  completed: { label: "Completed", color: "primary" },
} as const;

export type Specialty = keyof typeof SPECIALTIES;
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;
