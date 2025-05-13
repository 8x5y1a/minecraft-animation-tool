import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Injectable({ providedIn: 'root' })
export class ZipService {
  private zip = new JSZip();

  public addFile(path: string, content: string | Blob) {
    this.zip.file(path, content);
  }

  public async download(filename = 'files.zip') {
    const blob = await this.zip.generateAsync({ type: 'blob' });
    saveAs(blob, filename);
    this.zip = new JSZip();
  }
}
