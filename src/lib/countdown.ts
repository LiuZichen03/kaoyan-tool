export function getCountdownDays(examDate: string): number {
  const exam = new Date(examDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = exam.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
