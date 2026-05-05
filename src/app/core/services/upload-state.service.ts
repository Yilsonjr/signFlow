import { Injectable, signal } from '@angular/core';

export interface SignatureZone {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  signerName: string;
  signerEmail: string;
}

export interface UploadState {
  file: File | null;
  fileBytes: ArrayBuffer | null;
  zones: SignatureZone[];
}

@Injectable({ providedIn: 'root' })
export class UploadStateService {
  private state = signal<UploadState>({
    file: null,
    fileBytes: null,
    zones: []
  });

  readonly currentState = this.state.asReadonly();

  setFile(file: File, fileBytes: ArrayBuffer) {
    this.state.set({ file, fileBytes, zones: [] });
  }

  addZone(zone: SignatureZone) {
    this.state.update(s => ({ ...s, zones: [...s.zones, zone] }));
  }

  removeZone(id: string) {
    this.state.update(s => ({ ...s, zones: s.zones.filter(z => z.id !== id) }));
  }

  updateZone(id: string, updates: Partial<SignatureZone>) {
    this.state.update(s => ({
      ...s,
      zones: s.zones.map(z => z.id === id ? { ...z, ...updates } : z)
    }));
  }

  clear() {
    this.state.set({ file: null, fileBytes: null, zones: [] });
  }
}
