import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-tutorial-modal',
  templateUrl: './tutorial-modal.component.html',
  styleUrls: ['./tutorial-modal.component.scss']
})
export class TutorialModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();
  @Output() doNotShowAgainEvent = new EventEmitter<void>();
  showModal: boolean = false

  ngOnInit(): void {
   setTimeout(() => {
    this.showModal = true
   }, 1300);
  }
  closeModal() {
    this.close.emit();
  }

  skipTutorial() {
    this.skip.emit();
  }

  doNotShowAgain() {
    this.doNotShowAgainEvent.emit();
  }
}
