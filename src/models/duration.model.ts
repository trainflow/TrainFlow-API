export class Duration {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;

  constructor(duration: Partial<Duration>) {
    this.days = duration.days ?? 0;
    this.hours = duration.hours ?? 0;
    this.minutes = duration.minutes ?? 0;
    this.seconds = duration.seconds ?? 0;
    this.milliseconds = duration.milliseconds ?? 0;
  }

  toMilliseconds(): number {
    const totalHours = this.hours + this.days * 24;
    const totalMinutes = this.minutes + totalHours * 60;
    const totalSeconds = this.seconds + totalMinutes * 60;
    const totalMilliseconds = this.milliseconds + totalSeconds * 1000;
    return totalMilliseconds;
  }
}
