export type ScanResult = {
  clean: boolean;
};

export interface MalwareScanner {
  scan(buffer: Buffer, mimeType: string): Promise<ScanResult>;
}
