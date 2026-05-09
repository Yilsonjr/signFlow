import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './empresa.component.html',
  styleUrls: ['./empresa.component.scss']
})
export class EmpresaComponent {}