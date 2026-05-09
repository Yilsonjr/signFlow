import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-done',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './done.component.html',
  styleUrls: ['./done.component.scss']
})
export class DoneComponent implements OnInit {
  private route = inject(ActivatedRoute);
  status = signal<'signed' | 'cancelled'>('signed');

  ngOnInit() {
    this.route.queryParams.subscribe((params: { [key: string]: any }) => {
      if (params['status'] === 'cancelled') {
        this.status.set('cancelled');
      }
    });
  }
}