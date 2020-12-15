import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fromEvent, interval, NEVER, Subject, } from 'rxjs';
import { buffer, debounceTime, filter, scan, startWith, switchMap, tap,   } from 'rxjs/internal/operators'

import * as moment from 'moment';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss']
})
export class CounterComponent implements OnInit {
  @ViewChild('pause', { read: ElementRef, static: true }) pause: ElementRef;
  timer;
  title = 'stopwatch';
  timerVal: moment.Moment;
  timerIsStart = false;
  counter: Subject<{ pause?: boolean, timerVal?: number }> = new Subject();

  constructor() { }

  ngOnInit(): void {
    this.initialTimer();
  }
  private initialTimer() {
    this.counter.pipe(
      startWith({ pause: true, timerVal: 0 }),
      scan((acc, val) => ({ ...acc, ...val })),
      tap(state => {
        this.convertFormat(state.timerVal)
      }),
      switchMap(state => state.pause ? NEVER : interval(1000).pipe(
        tap(val => {
          state.timerVal += 1;
          this.convertFormat(state.timerVal)
        })
      ))
    ).subscribe();
  }
  private convertFormat(interval) {
    const duration = moment.duration(interval, 'seconds');
    const time = moment.utc(duration.asMilliseconds()).format('HH:mm:ss');
    this.timer = time;
  }
  startTimer(): void {
    this.timerIsStart = true;
    this.counter.next({ pause: false });
  }
  stopTimer(): void {
    this.timerIsStart = false;
    this.counter.next({ pause: true, timerVal: 0  });
  }
  pauseTimer(): void {
    const click = fromEvent(this.pause.nativeElement, 'click')
    click.pipe(
      buffer(click.pipe(
        debounceTime(300)
      )),
      filter(clickArray => clickArray.length > 1)
    ).subscribe(() => {
      this.timerIsStart = false;
      this.counter.next({ pause: true });
    })
  }
  resetTimer(): void {
    this.counter.next({ timerVal: 0 })
  }
}
