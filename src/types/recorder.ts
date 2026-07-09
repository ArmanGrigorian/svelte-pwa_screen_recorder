export type RecorderType = 'ready' | 'ready.countdown' | 'recording' | 'paused' | 'reviewing';

export type StudioTab = 'studio' | 'library' | 'portfolio';

export type RecordingResolution = '4k' | '1080p' | '720p';

export type RecordingSourceMode = 'screen_audio' | 'screen_mic' | 'screen_only';

export interface RecordingOptions {
	mimeType: string;
	frameRate: number;
	audioBitsPerSecond: number;
	videoBitsPerSecond: number;
	audio: boolean;
	resolution: RecordingResolution;
	sourceMode: RecordingSourceMode;
	includeMic: boolean;
}

export interface RecordingResult {
	id: string;
	title: string;
	duration: number;
	blob: Blob;
	mimeType: string;
	resolution: RecordingResolution;
	size: number;
	timestamp: number;
	snapshotUrl?: string;
}

export interface RecordingHistoryItem {
	id: string;
	title: string;
	duration: number;
	blob: Blob;
	mimeType: string;
	resolution: RecordingResolution;
	size: number;
	timestamp: number;
	snapshotBlob?: Blob;
}

export interface I_RecorderProps {
	options?: Partial<RecordingOptions>;
	onRecordingStart?: () => void;
	onRecordingStop?: (result: RecordingResult) => void;
	onRecordingError?: (error: Error) => void;
}
